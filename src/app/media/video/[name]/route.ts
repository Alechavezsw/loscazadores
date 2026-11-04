import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NOMBRE_VIDEO_VALIDO, VIDEOS_DIR } from "@/lib/videos";

const TIPOS: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

/**
 * Sirve los videos guardados en disco. Entiende el encabezado Range, que es lo que permite adelantar y
 * retroceder y que el video empiece a verse sin bajarlo entero.
 */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!NOMBRE_VIDEO_VALIDO.test(name)) return new Response("No encontrado", { status: 404 });

  const archivo = path.join(VIDEOS_DIR, name);
  let tamanio: number;
  try {
    tamanio = (await fs.stat(archivo)).size;
  } catch {
    return new Response("No encontrado", { status: 404 });
  }

  const base = {
    "Content-Type": TIPOS[name.split(".").pop()!],
    "Accept-Ranges": "bytes",
    // El nombre es un hash aleatorio: nunca cambia el contenido de una URL.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const rango = req.headers.get("range");
  if (!rango) {
    return new Response(Readable.toWeb(createReadStream(archivo)) as ReadableStream, {
      headers: { ...base, "Content-Length": String(tamanio) },
    });
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(rango.trim());
  let inicio = m?.[1] ? Number(m[1]) : NaN;
  let fin = m?.[2] ? Number(m[2]) : NaN;
  if (!m || (Number.isNaN(inicio) && Number.isNaN(fin))) {
    return new Response("Rango inválido", { status: 416, headers: { "Content-Range": `bytes */${tamanio}` } });
  }
  // "bytes=-500" pide los últimos 500 bytes; "bytes=500-" pide desde el 500 hasta el final.
  if (Number.isNaN(inicio)) {
    inicio = Math.max(0, tamanio - fin);
    fin = tamanio - 1;
  } else if (Number.isNaN(fin) || fin >= tamanio) {
    fin = tamanio - 1;
  }
  if (inicio > fin || inicio >= tamanio) {
    return new Response("Rango inválido", { status: 416, headers: { "Content-Range": `bytes */${tamanio}` } });
  }

  return new Response(Readable.toWeb(createReadStream(archivo, { start: inicio, end: fin })) as ReadableStream, {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${inicio}-${fin}/${tamanio}`, "Content-Length": String(fin - inicio + 1) },
  });
}
