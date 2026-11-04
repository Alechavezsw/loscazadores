import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { fetchPublico } from "./red";
import { UPLOADS_DIR, usaPostgres } from "./store";
import { borrarImagenEnBd, guardarImagenEnBd, leerImagenEnBd } from "./store-pg";

const MAX_BYTES = 12 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export const NOMBRE_VALIDO = /^[a-f0-9]{16}\.webp$/;

export class ErrorImagen extends Error {}

/** Blob queda solo como respaldo si no hay base. Con Postgres las fotos van a lc_imagenes. */
const usaBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const esUrl = (v: string) => v.startsWith("https://");

/**
 * Reduce a 1600 px como máximo, pasa a WebP y guarda. Devuelve lo que se anota en la noticia: el nombre del
 * archivo en la base (se sirve desde /media), la dirección pública en Vercel Blob, o el archivo en disco.
 */
async function procesarYGuardar(entrada: Buffer): Promise<string> {
  let salida: Buffer;
  try {
    salida = await sharp(entrada)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ErrorImagen("No pudimos leer esa imagen. Probá con otro archivo.");
  }
  const nombre = `${randomBytes(8).toString("hex")}.webp`;

  if (usaPostgres()) {
    try {
      await guardarImagenEnBd(nombre, salida);
      return nombre;
    } catch (e) {
      console.error("[imagenes] base:", e instanceof Error ? e.message : e);
      throw new ErrorImagen("No se pudo guardar la imagen en la base.");
    }
  }

  if (usaBlob()) {
    try {
      const r = await put(`uploads/${nombre}`, salida, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        cacheControlMaxAge: 31_536_000,
      });
      return r.url;
    } catch (e) {
      console.error("[imagenes] Vercel Blob:", e instanceof Error ? e.message : e);
      throw new ErrorImagen("No se pudo guardar la imagen en Vercel Blob. Revisá que esté conectado a este proyecto.");
    }
  }

  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, nombre), salida);
  } catch {
    throw new ErrorImagen("No se pudo guardar la imagen en el disco del servidor.");
  }
  return nombre;
}

/** Valida y guarda una imagen subida desde el panel. */
export async function guardarImagen(archivo: File): Promise<string> {
  if (!TIPOS.has(archivo.type)) {
    throw new ErrorImagen("La imagen tiene que ser JPG, PNG, WebP, AVIF o GIF.");
  }
  if (archivo.size > MAX_BYTES) {
    throw new ErrorImagen("La imagen pesa más de 12 MB. Probá con una más liviana.");
  }
  return procesarYGuardar(Buffer.from(await archivo.arrayBuffer()));
}

/**
 * Baja una foto de una publicación importada y la guarda en el servidor. Las direcciones de imagen de
 * Meta y de los servicios de feeds caducan, por eso se guarda una copia. Devuelve null si no se pudo,
 * sin cortar la importación: la noticia queda con la portada de la marca.
 */
export async function guardarImagenDesdeUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const { tipo, datos } = await fetchPublico(url, { maxBytes: MAX_BYTES * 2, accept: "image/*" });
    if (!tipo.startsWith("image/") || datos.length === 0) return null;
    return await procesarYGuardar(datos);
  } catch (e) {
    if (e instanceof ErrorImagen) console.error("[imagenes]", e.message);
    return null;
  }
}

/** Lee una foto guardada: primero la base, y si no está, el disco. */
export async function leerImagenGuardada(nombre: string): Promise<Buffer | null> {
  if (usaPostgres()) {
    const enBd = await leerImagenEnBd(nombre);
    if (enBd) return enBd;
  }
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, nombre));
  } catch {
    return null;
  }
}

export async function borrarImagen(valor: string | null | undefined) {
  if (!valor) return;
  if (esUrl(valor)) {
    if (usaBlob()) await del(valor).catch(() => undefined);
    return;
  }
  if (!NOMBRE_VALIDO.test(valor)) return;
  if (usaPostgres()) await borrarImagenEnBd(valor);
  await fs.rm(path.join(UPLOADS_DIR, valor), { force: true });
}
