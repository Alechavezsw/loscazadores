import type { Contenido } from "./contenido";
import { embedFacebook, embedInstagram, idVideoYoutube } from "./urls";

/**
 * Incrustar contenido de otros sitios dentro de una nota. Solo se aceptan los servicios de esta lista: de lo
 * que se pega se saca la dirección y el iframe se arma desde cero, así que nunca se publica HTML ajeno.
 * Sirve tanto en el navegador (para avisar al instante) como en el servidor (para validar).
 */

export type Proveedor = "youtube" | "vimeo" | "tiktok" | "facebook" | "instagram";

export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
};

export type Incrustado = {
  proveedor: Proveedor;
  /** Dirección limpia de la publicación original. Es lo que se guarda. */
  url: string;
  /** Dirección del iframe. */
  src: string;
  /** "video" se ve horizontal 16:9, "vertical" es de celular, "alto" tiene una altura fija. */
  forma: "video" | "vertical" | "alto";
  alto?: number;
  /** Para marcar la nota con el distintivo de video. */
  esVideo: boolean;
};

function decodificar(t: string) {
  return t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Si lo pegado es el código de insertar (un iframe), se queda solo con la dirección. */
function sacarEnlace(crudo: string): string {
  const t = crudo.trim();
  if (!/^<iframe/i.test(t)) return t;
  const src = t.match(/\ssrc=["']([^"']+)["']/i)?.[1];
  if (!src) return "";
  const dir = decodificar(src);
  try {
    const u = new URL(dir);
    // El plugin de Facebook lleva la publicación en el parámetro href.
    const href = u.searchParams.get("href");
    if (/(^|\.)facebook\.com$/.test(u.hostname) && href) return href;
  } catch {
    return "";
  }
  return dir;
}

export function incrustar(crudo: string): Incrustado | null {
  const entrada = sacarEnlace(crudo);
  if (!/^https?:\/\/\S+$/i.test(entrada)) return null;
  let u: URL;
  try {
    u = new URL(entrada);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const url = u.toString();

  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const id = idVideoYoutube(entrada);
    return id
      ? { proveedor: "youtube", url, src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`, forma: "video", esVideo: true }
      : null;
  }

  if (host.endsWith("vimeo.com")) {
    const m = u.pathname.match(/\/(?:video\/)?(\d{6,})(?:\/([a-z0-9]+))?/i);
    if (!m) return null;
    const hash = m[2] ? `&h=${m[2]}` : "";
    return { proveedor: "vimeo", url, src: `https://player.vimeo.com/video/${m[1]}?dnt=1${hash}`, forma: "video", esVideo: true };
  }

  if (host.endsWith("tiktok.com")) {
    const m = u.pathname.match(/\/video\/(\d+)/);
    return m
      ? { proveedor: "tiktok", url, src: `https://www.tiktok.com/embed/v2/${m[1]}`, forma: "vertical", alto: 740, esVideo: true }
      : null;
  }

  if (host.endsWith("instagram.com") || host === "instagr.am") {
    const src = embedInstagram(entrada);
    return src ? { proveedor: "instagram", url, src, forma: "alto", alto: 720, esVideo: /\/(reel|reels|tv)\//i.test(u.pathname) } : null;
  }

  if (host.endsWith("facebook.com") || host === "fb.watch" || host === "fb.com") {
    const e = embedFacebook(entrada);
    return e ? { proveedor: "facebook", url, src: e.src, forma: "alto", alto: e.alto, esVideo: /\/(videos|reel|watch)\b|fb\.watch/i.test(entrada) } : null;
  }

  return null;
}

export const MAX_INCRUSTADOS = 6;

export type LecturaIncrustados = {
  validos: Incrustado[];
  errores: Array<{ linea: number; texto: string }>;
};

/** Una dirección o un código de insertar por línea. */
export function leerIncrustados(texto: string): LecturaIncrustados {
  // Un iframe pegado en varias líneas se junta en una sola.
  const plano = texto.replace(/<iframe[\s\S]*?>(?:\s*<\/iframe>)?/gi, (m) => `\n${m.replace(/\s+/g, " ")}\n`);
  const lineas = plano
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const validos: Incrustado[] = [];
  const errores: LecturaIncrustados["errores"] = [];
  lineas.forEach((l, i) => {
    const r = incrustar(l);
    if (!r) errores.push({ linea: i + 1, texto: l.length > 60 ? `${l.slice(0, 57)}…` : l });
    else if (!validos.some((v) => v.src === r.src)) validos.push(r);
  });
  return { validos, errores };
}

/** La nota se marca como "video" si trae un archivo subido o un incrustado que lo es, arriba o dentro del texto. */
export function tieneVideo(n: { video?: string; incrustados?: string[]; contenido?: Contenido }) {
  if (n.video || (n.incrustados ?? []).some((u) => incrustar(u)?.esVideo)) return true;
  return (n.contenido?.content ?? []).some((b) => b.type === "video" || (b.type === "incrustado" && incrustar(b.attrs.url)?.esVideo));
}
