import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { connection } from "next/server";
import { usaPostgres } from "@/lib/store";
import { infoVideoEnBd, leerTrozoVideoEnBd, trozosDeVideoEnBd } from "@/lib/store-pg";
import { NOMBRE_VIDEO_VALIDO, VIDEOS_DIR } from "@/lib/videos";

const TIPOS: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

/** De dónde sale el video: su tamaño y cómo leer un tramo [inicio, fin] (ambos incluidos). */
type Fuente = { tamanio: number; leer: (inicio: number, fin: number) => ReadableStream };

/** Lee el tramo de la base trozo por trozo, sin tener el video entero en memoria. */
function tramoDeBd(nombre: string, inicio: number, fin: number): ReadableStream<Uint8Array> {
  let trozos: Awaited<ReturnType<typeof trozosDeVideoEnBd>> | null = null;
  let i = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controlador) {
      try {
        trozos ??= await trozosDeVideoEnBd(nombre, inicio, fin);
        if (i >= trozos.length) return controlador.close();
        const t = trozos[i++];
        const datos = await leerTrozoVideoEnBd(nombre, t.n);
        if (!datos) throw new Error(`Falta el trozo ${t.n} de ${nombre}`);
        const desde = Math.max(inicio, t.inicio) - t.inicio;
        const hasta = Math.min(fin, t.inicio + t.largo - 1) - t.inicio + 1;
        controlador.enqueue(new Uint8Array(datos.subarray(desde, hasta)));
      } catch (e) {
        controlador.error(e);
      }
    },
  });
}

async function fuenteDeBd(nombre: string): Promise<Fuente | null> {
  const info = await infoVideoEnBd(nombre);
  if (!info?.completo) return null;
  return { tamanio: info.bytes, leer: (inicio, fin) => tramoDeBd(nombre, inicio, fin) };
}

async function fuenteDeDisco(nombre: string): Promise<Fuente | null> {
  const archivo = path.join(VIDEOS_DIR, nombre);
  try {
    const tamanio = (await fs.stat(archivo)).size;
    return {
      tamanio,
      leer: (inicio, fin) => Readable.toWeb(createReadStream(archivo, { start: inicio, end: fin })) as ReadableStream,
    };
  } catch {
    return null;
  }
}

/**
 * Sirve los videos guardados en la base (o, si no hay base, en disco). Entiende el encabezado Range, que es lo que
 * permite adelantar y retroceder y que el video empiece a verse sin bajarlo entero.
 */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  await connection();
  const { name } = await params;
  if (!NOMBRE_VIDEO_VALIDO.test(name)) return new Response("No encontrado", { status: 404 });

  // Con base se mira primero ahí; el disco queda para los videos que se subieron antes de usar la base.
  const fuente = (usaPostgres() ? await fuenteDeBd(name) : null) ?? (await fuenteDeDisco(name));
  if (!fuente) return new Response("No encontrado", { status: 404 });
  const { tamanio } = fuente;

  const base = {
    "Content-Type": TIPOS[name.split(".").pop()!],
    "Accept-Ranges": "bytes",
    // El nombre es un hash aleatorio: nunca cambia el contenido de una URL.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const rango = req.headers.get("range");
  if (!rango) {
    return new Response(fuente.leer(0, tamanio - 1), { headers: { ...base, "Content-Length": String(tamanio) } });
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

  return new Response(fuente.leer(inicio, fin), {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${inicio}-${fin}/${tamanio}`, "Content-Length": String(fin - inicio + 1) },
  });
}
