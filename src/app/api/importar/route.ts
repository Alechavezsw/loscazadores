import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { objetosDeAviso, publicacionDesdeObjeto } from "@/lib/feeds";
import type { PublicacionExterna } from "@/lib/meta";
import { mutateDb, readDb } from "@/lib/store";
import { importarPublicaciones } from "@/lib/sync";
import type { EventoWebhook } from "@/lib/types";
import { claveValida } from "@/lib/webhook";

/**
 * Recibe publicaciones de Make, Zapier o cualquier herramienta que pueda hacer un pedido HTTP.
 * Pide la clave del panel en "Authorization: Bearer <clave>" (o en ?clave=). Acepta JSON o formulario.
 */

// Baja las fotos del aviso: en Vercel necesita más que los 10 segundos de siempre.
export const maxDuration = 60;

const MAX_BYTES = 512_000;
const MAX_POSTS = 20;
const MAX_EVENTOS = 8;

// Freno contra adivinar la clave: 20 intentos fallidos en 10 minutos bloquean esa dirección por 10 minutos.
const VENTANA_MS = 10 * 60_000;
const fallos = new Map<string, number[]>();

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
}

function direccion(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

async function leerCarga(req: Request): Promise<unknown> {
  const tipo = (req.headers.get("content-type") ?? "").toLowerCase();

  if (tipo.includes("multipart/form-data")) {
    const f = await req.formData();
    return Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string"));
  }

  const crudo = await req.text();
  if (crudo.length > MAX_BYTES) throw new RangeError("grande");
  if (!crudo.trim()) return {};
  try {
    return JSON.parse(crudo);
  } catch {
    // Zapier y Make pueden mandar formulario aunque no lo declaren bien.
    if (crudo.includes("=")) return Object.fromEntries(new URLSearchParams(crudo));
    throw new SyntaxError("json");
  }
}

async function anotar(eventos: EventoWebhook[]) {
  if (eventos.length === 0) return;
  await mutateDb((db) => {
    const w = db.meta.webhook;
    w.recibidos += eventos.length;
    w.eventos = [...eventos.reverse(), ...w.eventos].slice(0, MAX_EVENTOS);
  });
}

async function recibir(req: Request) {
  await connection();
  const { meta } = await readDb();
  if (!meta.webhook.claveHash) {
    return json({ error: "Los avisos no están activados. Generá una clave en el panel, en Redes." }, 404);
  }

  const ip = direccion(req);
  const ahora = Date.now();
  const recientes = (fallos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= 20) return json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." }, 429);

  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const clave = bearer ?? url.searchParams.get("clave") ?? "";
  if (!claveValida(clave, meta.webhook.claveHash)) {
    fallos.set(ip, [...recientes, ahora]);
    return json({ error: "Clave incorrecta." }, 401);
  }
  fallos.delete(ip);

  let carga: unknown;
  try {
    carga = await leerCarga(req);
  } catch (e) {
    const grande = e instanceof RangeError;
    await anotar([{ en: new Date().toISOString(), red: null, estado: "error", detalle: grande ? "El aviso era demasiado grande." : "El aviso no se pudo leer como JSON ni como formulario." }]);
    return json({ error: grande ? "El aviso es demasiado grande." : "No se pudo leer el aviso. Mandalo como JSON o como formulario." }, grande ? 413 : 400);
  }

  // Valores sueltos de la dirección (por ejemplo ?red=instagram) sirven de respaldo para lo que falte.
  const porDefecto = Object.fromEntries([...url.searchParams.entries()].filter(([k]) => k !== "clave"));
  const objetos = objetosDeAviso(carga).slice(0, MAX_POSTS);
  const posts: PublicacionExterna[] = [];
  const errores: string[] = [];
  for (const o of objetos) {
    const r = publicacionDesdeObjeto({ ...porDefecto, ...o });
    if ("error" in r) errores.push(r.error);
    else posts.push(r);
  }

  if (posts.length === 0) {
    const motivo = errores[0] ?? "El aviso no trae ninguna publicación.";
    await anotar([{ en: new Date().toISOString(), red: null, estado: "error", detalle: motivo }]);
    return json({ error: motivo }, 422);
  }

  const en = new Date().toISOString();
  const r = await importarPublicaciones(posts);
  await anotar([
    ...r.detalle.map(({ post, estado }) => ({
      en,
      red: post.red,
      estado,
      detalle: (post.texto.replace(/\s+/g, " ").trim() || post.enlace).slice(0, 80),
    })),
    ...errores.map((detalle) => ({ en, red: null, estado: "error" as const, detalle })),
  ]);

  // El público ve lo nuevo en unos instantes: el caché se renueva en segundo plano.
  revalidateTag("contenido", "max");

  return json({
    ok: true,
    nuevas: r.nuevas,
    unidas: r.fusionadas,
    repetidas: r.repetidas,
    omitidas: errores.length,
    publicaciones: r.detalle.map(({ post, estado }) => ({ red: post.red, id: post.id, estado })),
  });
}

export const POST = recibir;
export const PUT = recibir;
