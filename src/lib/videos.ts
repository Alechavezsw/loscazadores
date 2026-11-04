import "server-only";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { del } from "@vercel/blob";
import { UPLOADS_DIR } from "./store";

/**
 * Videos subidos. Con Vercel Blob conectado (BLOB_READ_WRITE_TOKEN) el navegador los sube directo a Blob,
 * porque una función de Vercel no recibe pedidos de más de 4,5 MB. Sin Blob (tu computadora o un servidor
 * propio) se guardan en el disco y se sirven desde /media/video, con soporte para adelantar y retroceder.
 */

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");

export const NOMBRE_VIDEO_VALIDO = /^[a-f0-9]{16}\.(mp4|webm|mov)$/;
const URL_BLOB_VALIDA = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/videos\/\S+$/i;

/** Lo que se anota en una noticia tiene que ser un archivo nuestro o una dirección de nuestro Blob, nada más. */
export const videoValido = (v: string) => NOMBRE_VIDEO_VALIDO.test(v) || URL_BLOB_VALIDA.test(v);

export const modoVideo = (): "blob" | "local" => (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");

export class ErrorVideo extends Error {}

const EXTENSION: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

/** Mira los primeros bytes: que el archivo diga ser un video no alcanza. */
function pareceVideo(cabecera: Buffer, ext: string) {
  if (ext === "webm") return cabecera.length >= 4 && cabecera.readUInt32BE(0) === 0x1a45dfa3;
  if (cabecera.length < 8) return false;
  return ["ftyp", "moov", "mdat", "wide", "free", "skip"].includes(cabecera.subarray(4, 8).toString("latin1"));
}

/** Guarda en disco un video que llega como flujo, sin cargarlo entero en memoria. Devuelve el nombre del archivo. */
export async function guardarVideoLocal(cuerpo: ReadableStream<Uint8Array>, tipo: string): Promise<string> {
  const ext = EXTENSION[tipo];
  if (!ext) throw new ErrorVideo("Formato no admitido. Subí un MP4 o un WebM.");

  const nombre = `${randomBytes(8).toString("hex")}.${ext}`;
  const destino = path.join(VIDEOS_DIR, nombre);
  const temporal = `${destino}.part`;
  await fs.mkdir(VIDEOS_DIR, { recursive: true });

  let total = 0;
  let cabecera = Buffer.alloc(0);
  const control = new Transform({
    transform(trozo: Buffer, _codificacion, listo) {
      total += trozo.length;
      if (total > MAX_VIDEO_BYTES) return listo(new ErrorVideo("El video pesa más de 200 MB."));
      if (cabecera.length < 12) cabecera = Buffer.concat([cabecera, trozo]).subarray(0, 12);
      listo(null, trozo);
    },
  });

  try {
    await pipeline(Readable.fromWeb(cuerpo as Parameters<typeof Readable.fromWeb>[0]), control, createWriteStream(temporal));
  } catch (e) {
    await fs.rm(temporal, { force: true });
    if (e instanceof ErrorVideo) throw e;
    throw new ErrorVideo("Se cortó la subida del video. Probá de nuevo.");
  }

  if (total === 0 || !pareceVideo(cabecera, ext)) {
    await fs.rm(temporal, { force: true });
    throw new ErrorVideo("Ese archivo no parece un video válido.");
  }
  await fs.rename(temporal, destino);
  return nombre;
}

export async function borrarVideo(valor: string | null | undefined) {
  if (!valor) return;
  if (valor.startsWith("https://")) {
    if (process.env.BLOB_READ_WRITE_TOKEN) await del(valor).catch(() => undefined);
    return;
  }
  if (!NOMBRE_VIDEO_VALIDO.test(valor)) return;
  await fs.rm(path.join(VIDEOS_DIR, valor), { force: true });
}
