import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { revisarPendientes } from "@/lib/pendientes";

// La importación baja fotos: en Vercel necesita más que los 10 segundos de siempre.
export const maxDuration = 60;

function igual(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

/**
 * Dispara la importación de todo lo que esté conectado (API de Meta y enlaces de feed).
 * Lo llama el cron de Vercel (vercel.json) o cualquier cron externo, con "Authorization: Bearer <CRON_SECRET>".
 * Vercel manda ese encabezado solo cuando la variable CRON_SECRET está definida. Sin ella, la ruta no existe.
 * Respeta el interruptor "Revisar solo" del panel; el intervalo lo decide quien llama.
 */
async function ejecutar(req: Request) {
  await connection();
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return new Response("No encontrado", { status: 404 });
  if (!igual(req.headers.get("authorization") ?? "", `Bearer ${secreto}`)) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const r = await revisarPendientes({ ignorarIntervalo: true });
    revalidateTag("contenido", "max");
    return Response.json({
      omitido: r.omitido ?? null,
      meta: r.meta ? { nuevas: r.meta.nuevas, fusionadas: r.meta.fusionadas, instagram: r.meta.instagram, facebook: r.meta.facebook } : null,
      feeds: r.feeds,
    });
  } catch {
    return Response.json({ error: "Falló la sincronización." }, { status: 502 });
  }
}

export const GET = ejecutar;
export const POST = ejecutar;
