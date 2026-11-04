import "server-only";
import type { Ajustes, LiveStatus } from "./types";
import { idVideoYoutube } from "./urls";

const TTL_MS = 45_000;
/** Una entrada por canal: el sitio consulta el propio y el de TOMATEVE. */
const memoria = new Map<string, { en: number; valor: LiveStatus }>();

const SIN: Omit<LiveStatus, "motivo"> = { live: false, videoId: null, titulo: null, canalId: null };

/** Convierte "@canal", un ID UC… o una URL de YouTube en la página /live del canal. */
export function urlLiveDelCanal(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  if (/^UC[\w-]{22}$/.test(v)) return `https://www.youtube.com/channel/${v}/live`;
  if (/^@?[\p{L}\p{N}._-]+$/u.test(v)) return `https://www.youtube.com/${v.startsWith("@") ? v : `@${v}`}/live`;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!/(^|\.)youtube\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(@[^/]+|channel\/UC[\w-]{22}|c\/[^/]+|user\/[^/]+)/);
    return m ? `https://www.youtube.com/${m[1]}/live` : null;
  } catch {
    return null;
  }
}

function decodificar(texto: string) {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function consultarYoutube(url: string): Promise<LiveStatus> {
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "accept-language": "es-AR,es;q=0.9,en;q=0.5",
      // Evita la pantalla de consentimiento de YouTube.
      cookie: "CONSENT=YES+cb; SOCS=CAI",
    },
  });
  if (!res.ok) return { ...SIN, motivo: "error" };
  const html = await res.text();

  const canalId = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ?? null;
  const videoId = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] ?? null;
  const enVivo = /"isLiveNow":true/.test(html) || /"isLive":true/.test(html);

  if (!videoId || !enVivo) return { ...SIN, canalId, motivo: "sin-transmision" };

  const titulo = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  return {
    live: true,
    videoId,
    titulo: titulo ? decodificar(titulo) : null,
    canalId,
    motivo: "en-vivo",
  };
}

export async function getLiveStatus(
  ajustes: Pick<Ajustes, "youtube" | "youtubeModo" | "youtubeVideoManual">,
  { forzar = false }: { forzar?: boolean } = {},
): Promise<LiveStatus> {
  if (ajustes.youtubeModo === "off") return { ...SIN, motivo: "apagado" };

  if (ajustes.youtubeModo === "manual") {
    const videoId = idVideoYoutube(ajustes.youtubeVideoManual);
    return videoId
      ? { live: true, videoId, titulo: null, canalId: null, motivo: "manual" }
      : { ...SIN, motivo: "sin-canal" };
  }

  const url = urlLiveDelCanal(ajustes.youtube);
  if (!url) return { ...SIN, motivo: "sin-canal" };

  const ahora = Date.now();
  const guardado = memoria.get(url);
  if (!forzar && guardado && ahora - guardado.en < TTL_MS) return guardado.valor;

  try {
    const valor = await consultarYoutube(url);
    memoria.set(url, { en: ahora, valor });
    return valor;
  } catch {
    // Si YouTube no responde, mantenemos el último estado conocido unos segundos más.
    if (guardado) return guardado.valor;
    return { ...SIN, motivo: "error" };
  }
}
