import "server-only";
import { cacheLife } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { urlLiveDelCanal } from "./live";

/** El video más reciente que subió un canal de YouTube. */
export type VideoCanal = {
  id: string;
  titulo: string;
  /** Fecha de publicación, en ISO. */
  publicado: string;
};

const CABECERAS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "accept-language": "es-AR,es;q=0.9,en;q=0.5",
  // Evita la pantalla de consentimiento de YouTube.
  cookie: "CONSENT=YES+cb; SOCS=CAI",
};

/** El ID de un canal no cambia: una vez resuelto desde su @usuario se recuerda mientras viva el proceso. */
const idsConocidos = new Map<string, string>();

/** Convierte "@canal", un ID UC… o la URL de un canal en su ID (el que pide el feed de YouTube). */
async function idDelCanal(valor: string): Promise<string | null> {
  const live = urlLiveDelCanal(valor);
  if (!live) return null;
  const pagina = live.replace(/\/live$/, "");

  const directo = pagina.match(/\/channel\/(UC[\w-]{22})$/)?.[1];
  if (directo) return directo;
  const conocido = idsConocidos.get(pagina);
  if (conocido) return conocido;

  const res = await fetch(pagina, { redirect: "follow", signal: AbortSignal.timeout(8_000), headers: CABECERAS });
  if (!res.ok || !res.body) return null;

  // La etiqueta canonical está al principio del HTML y la página entera pesa más de 1 MB: se corta la descarga
  // apenas aparece.
  const lector = res.body.getReader();
  const decodificador = new TextDecoder();
  let html = "";
  let id: string | null = null;
  try {
    while (html.length < 400_000) {
      const { done, value } = await lector.read();
      if (done) break;
      html += decodificador.decode(value, { stream: true });
      id = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1] ?? null;
      if (id) break;
    }
  } finally {
    await lector.cancel().catch(() => undefined);
  }

  if (id) idsConocidos.set(pagina, id);
  return id;
}

/**
 * El último video publicado en un canal de YouTube, leído del feed público del canal (no hace falta clave de API).
 * Acepta lo mismo que el campo del panel: "@usuario", el ID que empieza con UC o el enlace del canal. Se renueva
 * solo cada pocos minutos; si YouTube no responde devuelve null y la portada muestra su alternativa.
 */
export async function getUltimoVideo(canal: string): Promise<VideoCanal | null> {
  "use cache";
  cacheLife("minutes");

  if (!canal.trim()) return null;
  try {
    const id = await idDelCanal(canal);
    if (!id) return null;

    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, {
      signal: AbortSignal.timeout(8_000),
      headers: CABECERAS,
    });
    if (!res.ok) return null;

    const doc = new XMLParser().parse(await res.text()) as { feed?: { entry?: unknown } };
    const entradas = [doc.feed?.entry].flat() as Array<Record<string, unknown> | undefined>;

    const videos: VideoCanal[] = [];
    for (const e of entradas) {
      const videoId = String(e?.["yt:videoId"] ?? "");
      const publicado = new Date(String(e?.published ?? ""));
      if (!/^[\w-]{11}$/.test(videoId) || Number.isNaN(publicado.getTime())) continue;
      // El parser vuelve número un título como "2026".
      videos.push({ id: videoId, titulo: String(e?.title ?? "").trim(), publicado: publicado.toISOString() });
    }
    // El feed ya viene del más nuevo al más viejo; se ordena igual por si cambia.
    videos.sort((a, b) => b.publicado.localeCompare(a.publicado));
    return videos[0] ?? null;
  } catch {
    return null;
  }
}
