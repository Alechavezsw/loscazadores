import { after } from "next/server";
import { COOKIE_ADMIN } from "@/lib/auth";
import { registrarEvento } from "@/lib/stats";
import { analizarUA } from "@/lib/ua";

/**
 * Recibe los avisos de las estadísticas (una visita, el tiempo leído, un clic…). Siempre contesta 204 y sin
 * contenido: no le dice nada a quien lo llame. El trabajo de anotar se hace después de responder.
 */

const vacia = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

const MAX_BYTES = 2048;

export async function POST(req: Request) {
  if (process.env.ESTADISTICAS === "off") return vacia();

  // Solo cuentan los avisos que mandan nuestras propias páginas.
  const origen = req.headers.get("sec-fetch-site");
  if (origen && origen !== "same-origin") return vacia();

  // Lo que hace el administrador mirando el sitio no es público: no se cuenta.
  if ((req.headers.get("cookie") ?? "").split(/;\s*/).some((c) => c.startsWith(`${COOKIE_ADMIN}=`))) return vacia();

  const ua = req.headers.get("user-agent") ?? "";
  const lectura = analizarUA(ua);
  if (lectura.bot) return vacia();

  let cuerpo: unknown;
  try {
    const t = await req.text();
    if (t.length > MAX_BYTES) return vacia();
    cuerpo = JSON.parse(t);
  } catch {
    return vacia();
  }

  const h = req.headers;
  const ctx = {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local",
    ua,
    host: h.get("host") ?? "",
    // Vercel (y Cloudflare, si algún día se usa) informan desde dónde se conecta la persona.
    pais: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "",
    region: h.get("x-vercel-ip-country-region") ?? "",
    ciudad: h.get("x-vercel-ip-city") ?? "",
  };

  after(() => registrarEvento(cuerpo, ctx, lectura).catch((e) => console.error("[stats]", e instanceof Error ? e.message : "error")));
  return vacia();
}
