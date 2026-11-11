import { MAX_VIDEO_BD_BYTES, MAX_VIDEO_BYTES, TIPOS_VIDEO, TROZO_VIDEO_BYTES, type ModoVideo } from "./video-limites";

/**
 * Lo que hace el navegador para subir fotos y videos desde el panel. Lo comparten los campos del formulario
 * (portada y video principal) y el editor del texto, que sube las fotos y los videos que se ponen entre los párrafos.
 */

const MB = 1024 * 1024;

/** Lo máximo que se acepta elegir, antes de achicar. */
export const MAX_ORIGINAL_MB = 25;
/**
 * Lo máximo que puede viajar al servidor. Vercel corta los pedidos de más de 4,5 MB, así que las fotos
 * se achican en el navegador (una de celular de 8 MB queda en unos 300 KB) antes de enviarlas.
 */
export const MAX_ENVIO_MB = 4;
const LADO_MAXIMO = 1600;
const ACHICAR_DESDE = 1_200_000;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/** Achica y pasa a WebP en el navegador. Si algo falla, devuelve el archivo original sin tocar. */
export async function reducirImagen(archivo: File): Promise<File> {
  // Los GIF animados no se tocan: al pasarlos por un lienzo perderían el movimiento.
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;
  try {
    const bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bmp.width, bmp.height));
    if (escala === 1 && archivo.size <= ACHICAR_DESDE) {
      bmp.close();
      return archivo;
    }
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bmp.width * escala);
    lienzo.height = Math.round(bmp.height * escala);
    lienzo.getContext("2d")?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/webp", 0.85));
    // Si el navegador no sabe codificar WebP devuelve PNG, que puede pesar más: se queda el original.
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, "")}.webp`, { type: blob.type });
  } catch {
    return archivo;
  }
}

/** Achica una foto, la sube y devuelve lo que se anota en el contenido de la nota. */
export async function subirFoto(original: File, senal?: AbortSignal): Promise<string> {
  if (!TIPOS_FOTO.includes(original.type)) throw new Error("La imagen tiene que ser JPG, PNG, WebP, AVIF o GIF.");
  if (original.size > MAX_ORIGINAL_MB * MB) throw new Error(`La imagen pesa más de ${MAX_ORIGINAL_MB} MB. Probá con una más liviana.`);
  const archivo = await reducirImagen(original);
  if (archivo.size > MAX_ENVIO_MB * MB) throw new Error(`La imagen pesa más de ${MAX_ENVIO_MB} MB y no se pudo achicar. Probá con otra.`);

  const datos = new FormData();
  datos.set("imagen", archivo);
  let r: Response;
  try {
    r = await fetch("/api/imagenes", { method: "POST", body: datos, signal: senal });
  } catch (err) {
    if (senal?.aborted) throw err;
    throw new Error("Se cortó la conexión. Probá de nuevo.");
  }
  const cuerpo = (await r.json().catch(() => ({}))) as { valor?: string; error?: string };
  if (!r.ok || !cuerpo.valor) throw new Error(cuerpo.error ?? "No se pudo subir la imagen.");
  return cuerpo.valor;
}

/** Manda un trozo. Si se corta la red lo reintenta un par de veces; un error del pedido no se arregla reintentando. */
async function enviarTrozo(url: string, pedazo: Blob, senal: AbortSignal) {
  let motivo = "Se cortó la conexión. Probá de nuevo.";
  for (let intento = 0; intento < 3; intento++) {
    let r: Response;
    try {
      r = await fetch(url, { method: "PUT", body: pedazo, signal: senal });
    } catch (err) {
      if (senal.aborted) throw err; // la persona canceló
      continue; // falló la red: se reintenta
    }
    if (r.ok) return;
    const e = (await r.json().catch(() => ({}))) as { error?: string };
    motivo = e.error ?? "No se pudo subir el video.";
    if (r.status < 500) break;
  }
  throw new Error(motivo);
}

/**
 * Sube a la base de datos de a trozos: cada pedido lleva un pedazo del archivo, porque una función de Vercel no
 * recibe pedidos de más de 4,5 MB. Al final el servidor comprueba que estén todos.
 */
async function subirABd(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  const json = { "Content-Type": "application/json" };
  const inicio = await fetch("/api/videos/db", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ accion: "iniciar", tipo: archivo.type, bytes: archivo.size }),
    signal: senal,
  });
  const abierta = (await inicio.json().catch(() => ({}))) as { nombre?: string; trozo?: number; error?: string };
  if (!inicio.ok || !abierta.nombre) throw new Error(abierta.error ?? "No se pudo preparar la subida.");

  const trozo = abierta.trozo ?? TROZO_VIDEO_BYTES;
  const total = Math.ceil(archivo.size / trozo);
  for (let n = 0; n < total; n++) {
    await enviarTrozo(`/api/videos/db?nombre=${encodeURIComponent(abierta.nombre)}&n=${n}`, archivo.slice(n * trozo, (n + 1) * trozo), senal);
    onProgreso(((n + 1) / total) * 100);
  }

  const fin = await fetch("/api/videos/db", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ accion: "terminar", nombre: abierta.nombre }),
    signal: senal,
  });
  const cerrada = (await fin.json().catch(() => ({}))) as { valor?: string; error?: string };
  if (!fin.ok || !cerrada.valor) throw new Error(cerrada.error ?? "No se pudo terminar la subida.");
  return cerrada.valor;
}

/** Sube directo a Vercel Blob: el permiso lo da /api/videos/blob y el archivo no pasa por nuestro servidor. */
async function subirABlob(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  const { upload } = await import("@vercel/blob/client");
  const limpio = archivo.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80) || "video.mp4";
  const r = await upload(`videos/${limpio}`, archivo, {
    access: "public",
    handleUploadUrl: "/api/videos/blob",
    multipart: true,
    contentType: archivo.type,
    abortSignal: senal,
    onUploadProgress: ({ percentage }) => onProgreso(percentage),
  });
  return r.url;
}

/** Sube al disco del servidor con un pedido PUT, para ver el avance. */
function subirLocal(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  return new Promise<string>((resolver, fallar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/videos/local");
    xhr.setRequestHeader("Content-Type", archivo.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso((e.loaded / e.total) * 100);
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText) as { valor?: string; error?: string };
        if (xhr.status < 300 && r.valor) resolver(r.valor);
        else fallar(new Error(r.error ?? "No se pudo subir el video."));
      } catch {
        fallar(new Error("No se pudo subir el video."));
      }
    };
    xhr.onerror = () => fallar(new Error("Se cortó la conexión. Probá de nuevo."));
    senal.addEventListener("abort", () => {
      xhr.abort();
      fallar(new DOMException("Cancelado", "AbortError"));
    });
    xhr.send(archivo);
  });
}

/** El tope de un video según dónde se guarda, en MB. */
export const maxVideoMb = (modo: ModoVideo) => Math.round((modo === "bd" ? MAX_VIDEO_BD_BYTES : MAX_VIDEO_BYTES) / MB);

/** Sube un video por el camino que corresponda y devuelve lo que se anota en la nota. */
export function subirVideo(archivo: File, modo: ModoVideo, onProgreso: (n: number) => void, senal: AbortSignal): Promise<string> {
  if (!(TIPOS_VIDEO as readonly string[]).includes(archivo.type)) return Promise.reject(new Error("Formato no admitido. Subí un MP4 o un WebM."));
  if (archivo.size > maxVideoMb(modo) * MB) {
    return Promise.reject(new Error(`El video pesa más de ${maxVideoMb(modo)} MB. Para videos largos conviene subirlos a YouTube e incrustar el enlace.`));
  }
  const subir = modo === "bd" ? subirABd : modo === "blob" ? subirABlob : subirLocal;
  return subir(archivo, onProgreso, senal);
}
