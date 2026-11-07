import { connection } from "next/server";
import { esAdmin } from "@/lib/auth";
import { ErrorVideo, guardarVideoLocal, MAX_VIDEO_BYTES, modoVideo } from "@/lib/videos";

// Subir un video grande por una conexión lenta puede tardar.
export const maxDuration = 300;

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Recibe un video como cuerpo crudo del pedido y lo guarda en disco mientras llega.
 * Solo sirve para quien está en el panel y solo sin base de datos ni Vercel Blob: con base los videos se suben por
 * trozos a /api/videos/db, y con Blob el navegador sube directo a Blob.
 */
export async function PUT(req: Request) {
  await connection();
  if (!(await esAdmin())) return json({ error: "Tenés que entrar al panel para subir videos." }, 401);
  if (modoVideo() !== "local") return json({ error: "Este sitio no guarda los videos en el disco." }, 409);
  if (!req.body) return json({ error: "No llegó ningún video." }, 400);

  const declarado = Number(req.headers.get("content-length") ?? 0);
  if (declarado > MAX_VIDEO_BYTES) return json({ error: "El video pesa más de 200 MB." }, 413);

  const tipo = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  try {
    const valor = await guardarVideoLocal(req.body, tipo);
    return json({ valor });
  } catch (e) {
    if (e instanceof ErrorVideo) return json({ error: e.message }, e.message.includes("200 MB") ? 413 : 400);
    return json({ error: "No se pudo guardar el video." }, 500);
  }
}
