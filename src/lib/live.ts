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

/** Los ajustes que deciden si hay transmisión: el canal y cómo se detecta. */
export type AjustesDeVivo = Pick<Ajustes, "youtube" | "youtubeModo" | "youtubeVideoManual">;

/**
 * Qué canal mira cada consulta. El sitio transmite por TomateTV: si no hay un canal propio cargado, la
 * sección «En vivo» sigue a ese. Y cuando los dos son el mismo canal, la tarjeta de TomateTV respeta también
 * el modo elegido en el panel (por ejemplo, el video puesto a mano), para que todo el sitio diga lo mismo.
 */
export function ajustesDeVivo(
  ajustes: AjustesDeVivo & Pick<Ajustes, "tomateve">,
  canal: "propio" | "tomateve" = "propio",
): AjustesDeVivo {
  const propio = urlLiveDelCanal(ajustes.youtube);
  const tomateve = urlLiveDelCanal(ajustes.tomateve);
  const unSoloCanal = !propio || propio === tomateve;

  if (canal === "tomateve" && !unSoloCanal) {
    return { youtube: ajustes.tomateve, youtubeModo: "auto", youtubeVideoManual: "" };
  }
  return {
    youtube: propio ? ajustes.youtube : ajustes.tomateve,
    youtubeModo: ajustes.youtubeModo,
    youtubeVideoManual: ajustes.youtubeVideoManual,
  };
}

// ───────────────────────── API oficial de YouTube ─────────────────────────
// Leer la página del canal alcanza en una computadora común, pero a los servidores de Vercel YouTube les
// entrega una página sin la marca de «en vivo». Con una clave (YOUTUBE_API_KEY) se pregunta por la API
// oficial: los últimos videos del canal y cuál de ellos está transmitiendo. Son 2 unidades de cuota por
// consulta (de 10.000 gratis por día).

const API = "https://www.googleapis.com/youtube/v3";
const idsPorApi = new Map<string, string>();

function claveApi() {
  return process.env.YOUTUBE_API_KEY?.trim() ?? "";
}

async function pedirApi<T>(recurso: string, parametros: Record<string, string>, clave: string): Promise<T | null> {
  const u = new URL(`${API}/${recurso}`);
  for (const [k, v] of Object.entries(parametros)) u.searchParams.set(k, v);
  u.searchParams.set("key", clave);
  const res = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    // Sin la dirección: lleva la clave.
    console.error(`[live] la API de YouTube respondió ${res.status} en ${recurso}`);
    return null;
  }
  return (await res.json()) as T;
}

/** El ID UC… del canal a partir de su página /live. `leido` es el que se vio al leer la página, si se vio. */
async function idDelCanalPorApi(urlLive: string, clave: string, leido: string | null): Promise<string | null> {
  const ruta = new URL(urlLive).pathname.replace(/\/live$/, "");
  const directo = ruta.match(/^\/channel\/(UC[\w-]{22})$/)?.[1];
  if (directo) return directo;
  const conocido = idsPorApi.get(ruta);
  if (conocido) return conocido;

  const usuario = decodeURIComponent(ruta.match(/^\/(@[^/]+)$/)?.[1] ?? "");
  const nombreViejo = decodeURIComponent(ruta.match(/^\/user\/([^/]+)$/)?.[1] ?? "");
  const filtro: Record<string, string> | null = usuario
    ? { forHandle: usuario }
    : nombreViejo
      ? { forUsername: nombreViejo }
      : null;
  if (!filtro) return leido;

  const r = await pedirApi<{ items?: { id?: string }[] }>("channels", { part: "id", ...filtro }, clave);
  const id = r?.items?.[0]?.id ?? null;
  if (id) idsPorApi.set(ruta, id);
  return id ?? leido;
}

type VideoApi = {
  id?: string;
  snippet?: { title?: string; channelId?: string; liveBroadcastContent?: string };
  liveStreamingDetails?: { actualStartTime?: string };
};

/** Devuelve null si la API no pudo responder (clave mal puesta, cuota agotada): vale entonces lo leído. */
async function consultarApi(urlLive: string, clave: string, leido: Lectura | null): Promise<LiveStatus | null> {
  const canalId = await idDelCanalPorApi(urlLive, clave, leido?.estado.canalId ?? null);

  // Candidatos: lo último que publicó el canal (ahí figuran sus transmisiones) y el video que mostraba su página.
  const ids = new Set<string>();
  if (leido?.candidato) ids.add(leido.candidato);
  if (canalId) {
    const lista = await pedirApi<{ items?: { contentDetails?: { videoId?: string } }[] }>(
      "playlistItems",
      { part: "contentDetails", playlistId: `UU${canalId.slice(2)}`, maxResults: "25" },
      clave,
    );
    for (const item of lista?.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) ids.add(id);
    }
  }
  if (ids.size === 0) return null;

  const videos = await pedirApi<{ items?: VideoApi[] }>(
    "videos",
    { part: "snippet,liveStreamingDetails", id: [...ids].join(","), maxResults: "50" },
    clave,
  );
  if (!videos) return null;

  const enVivo = (videos.items ?? [])
    .filter((v) => v.id && v.snippet?.liveBroadcastContent === "live" && (!canalId || v.snippet.channelId === canalId))
    // Si hubiera dos transmisiones a la vez, la que empezó última.
    .sort((a, b) =>
      (b.liveStreamingDetails?.actualStartTime ?? "").localeCompare(a.liveStreamingDetails?.actualStartTime ?? ""),
    )[0];

  if (!enVivo?.id) return { ...SIN, canalId, motivo: "sin-transmision" };
  return { live: true, videoId: enVivo.id, titulo: enVivo.snippet?.title ?? null, canalId, motivo: "en-vivo" };
}

// ───────────────────────── lectura de la página del canal ─────────────────────────

/** Lo que dice la página /live del canal. `candidato` es el video que muestra, esté o no al aire. */
type Lectura = { estado: LiveStatus; candidato: string | null };

async function consultarYoutube(url: string): Promise<Lectura> {
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
  if (!res.ok) return { estado: { ...SIN, motivo: "error" }, candidato: null };
  const html = await res.text();

  const canalId = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ?? null;
  const videoId = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] ?? null;
  const enVivo = /"isLiveNow":true/.test(html) || /"isLive":true/.test(html);

  if (!videoId || !enVivo) return { estado: { ...SIN, canalId, motivo: "sin-transmision" }, candidato: videoId };

  const titulo = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  return {
    estado: { live: true, videoId, titulo: titulo ? decodificar(titulo) : null, canalId, motivo: "en-vivo" },
    candidato: videoId,
  };
}

export async function getLiveStatus(
  ajustes: AjustesDeVivo,
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

  // Primero la página del canal, que no gasta cuota. Si no muestra una transmisión y hay clave, decide la API.
  const leido = await consultarYoutube(url).catch(() => null);
  let valor = leido?.estado ?? null;

  const clave = claveApi();
  if (clave && !valor?.live) {
    const porApi = await consultarApi(url, clave, leido).catch(() => null);
    if (porApi) valor = porApi;
  }

  // Si YouTube no responde, mantenemos el último estado conocido unos segundos más.
  if (!valor) return guardado?.valor ?? { ...SIN, motivo: "error" };
  memoria.set(url, { en: ahora, valor });
  return valor;
}
