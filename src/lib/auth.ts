import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const COOKIE_ADMIN = "lc_admin";
const COOKIE = COOKIE_ADMIN;
const DURACION_MS = 1000 * 60 * 60 * 24 * 7;

function secreto() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function firmar(exp: string) {
  return createHmac("sha256", secreto()).update(exp).digest("hex");
}

function iguales(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function panelConfigurado() {
  return Boolean(process.env.ADMIN_PASSWORD) && secreto().length > 0;
}

// Freno simple contra fuerza bruta: 5 errores en 10 minutos bloquean por 10 minutos.
const VENTANA_MS = 10 * 60_000;
const errores = new Map<string, number[]>();

async function ipActual() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function intentarLogin(password: string): Promise<"ok" | "mal" | "bloqueado" | "sin-config"> {
  if (!panelConfigurado()) return "sin-config";
  const ip = await ipActual();
  const ahora = Date.now();
  const recientes = (errores.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= 5) return "bloqueado";

  if (!iguales(password, process.env.ADMIN_PASSWORD!)) {
    recientes.push(ahora);
    errores.set(ip, recientes);
    return "mal";
  }

  errores.delete(ip);
  const exp = String(ahora + DURACION_MS);
  (await cookies()).set(COOKIE, `${exp}.${firmar(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_MS / 1000,
  });
  return "ok";
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function esAdmin() {
  // La sesión depende del reloj: nunca debe entrar en el HTML prerenderizado.
  await connection();
  if (!panelConfigurado()) return false;
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return false;
  const [exp, firma] = valor.split(".");
  if (!exp || !firma || Number(exp) < Date.now()) return false;
  return iguales(firma, firmar(exp));
}

/** Cortar acá cualquier página o acción del panel si no hay sesión. */
export async function requerirAdmin() {
  if (!(await esAdmin())) redirect("/admin/login");
}
