import "server-only";
import type { Canal, ConexionMeta } from "./types";

/**
 * Cliente mínimo de la Graph API de Meta. Solo lee: lista las páginas del usuario,
 * las publicaciones de la Página de Facebook y las de su cuenta de Instagram profesional.
 */

// Se fija la versión para que un cambio de Meta no rompa el sitio sin avisar.
const VERSION = process.env.META_GRAPH_VERSION || "v25.0";
const BASE = (process.env.META_GRAPH_BASE || "https://graph.facebook.com").replace(/\/$/, "");

// Códigos de Meta que significan "este token ya no sirve".
const CODIGOS_TOKEN = new Set([190, 102, 463, 467]);

export class ErrorMeta extends Error {
  constructor(
    mensaje: string,
    readonly codigo?: number,
    readonly reconectar = false,
  ) {
    super(mensaje);
  }
}

export type PublicacionExterna = {
  red: Extract<Canal, "instagram" | "facebook">;
  id: string;
  texto: string;
  imagenUrl: string | null;
  enlace: string;
  /** ISO 8601 en UTC. */
  fecha: string;
};

type Respuesta<T> = { data?: T[]; error?: { message?: string; code?: number } };

async function graph<T>(ruta: string, params: Record<string, string>, token?: string): Promise<T> {
  const url = new URL(`${BASE}/${VERSION}/${ruta.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (token) url.searchParams.set("access_token", token);
  // Todo valor largo (tokens, secreto) se tapa si Meta lo repite en un mensaje de error.
  const secretos = [token, ...Object.values(params)].filter((v): v is string => Boolean(v) && v!.length >= 20);

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new ErrorMeta("No se pudo comunicar con Meta. Revisá la conexión del servidor y probá de nuevo.");
  }

  let cuerpo: (T & Respuesta<unknown>) | null = null;
  try {
    cuerpo = (await res.json()) as T & Respuesta<unknown>;
  } catch {
    // Se informa más abajo con el estado HTTP.
  }

  if (!res.ok || cuerpo?.error) {
    const codigo = cuerpo?.error?.code;
    const mensaje = secretos.reduce(
      (txt, s) => txt.split(s).join("…"),
      cuerpo?.error?.message ?? `Meta respondió con el estado ${res.status}.`,
    );
    const vencido = codigo !== undefined && CODIGOS_TOKEN.has(codigo);
    throw new ErrorMeta(
      vencido ? `Meta rechazó el token: puede estar vencido o mal copiado. Detalle de Meta: ${mensaje}` : mensaje,
      codigo,
      vencido,
    );
  }
  if (!cuerpo) throw new ErrorMeta("Meta devolvió una respuesta vacía.");
  return cuerpo;
}

/** Meta devuelve fechas como 2026-10-25T12:00:00+0000. Las pasamos a ISO estándar. */
export function fechaIso(valor: string | undefined): string {
  if (!valor) return new Date().toISOString();
  const arreglada = valor.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const t = Date.parse(arreglada);
  return Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
}

type Pagina = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: { id: string; username?: string };
};

/**
 * Convierte el token que se pega en el panel (de corta duración) en una conexión permanente:
 * lo canjea por uno de 60 días y de ahí saca el token de la Página, que no vence.
 */
export async function conectar(tokenUsuario: string, pagina?: string): Promise<ConexionMeta> {
  const appId = process.env.META_APP_ID;
  const secreto = process.env.META_APP_SECRET;
  if (!appId || !secreto) {
    throw new ErrorMeta("Faltan META_APP_ID y META_APP_SECRET en el archivo .env.local del servidor.");
  }

  const largo = await graph<{ access_token?: string }>(
    "oauth/access_token",
    { grant_type: "fb_exchange_token", client_id: appId, client_secret: secreto, fb_exchange_token: tokenUsuario },
  );
  if (!largo.access_token) throw new ErrorMeta("Meta no devolvió el token de larga duración.");

  const cuentas = await graph<Respuesta<Pagina>>(
    "me/accounts",
    { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "100" },
    largo.access_token,
  );
  const paginas = (cuentas.data ?? []).filter((p) => p.access_token);
  if (paginas.length === 0) {
    throw new ErrorMeta(
      "Ese usuario no administra ninguna Página, o al token le faltan los permisos pages_show_list y pages_read_engagement.",
    );
  }

  const buscada = pagina?.trim().toLowerCase();
  const elegida = buscada
    ? paginas.find((p) => p.id === buscada || p.name.toLowerCase() === buscada)
    : paginas.length === 1
      ? paginas[0]
      : undefined;

  if (!elegida) {
    const lista = paginas.map((p) => `${p.name} (${p.id})`).join(", ");
    throw new ErrorMeta(
      buscada
        ? `No encontramos esa Página entre las tuyas. Las que ves son: ${lista}.`
        : `Administrás más de una Página. Escribí cuál querés usar: ${lista}.`,
    );
  }

  return {
    pageId: elegida.id,
    pageNombre: elegida.name,
    pageToken: elegida.access_token!,
    igId: elegida.instagram_business_account?.id ?? null,
    igUsuario: elegida.instagram_business_account?.username ?? null,
    conectadaEn: new Date().toISOString(),
  };
}

type MediaIg = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

export async function leerInstagram(con: ConexionMeta, limite = 10): Promise<PublicacionExterna[]> {
  if (!con.igId) return [];
  const r = await graph<Respuesta<MediaIg>>(
    `${con.igId}/media`,
    { fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp", limit: String(limite) },
    con.pageToken,
  );
  return (r.data ?? [])
    .filter((m) => m.permalink)
    .map((m) => ({
      red: "instagram" as const,
      id: m.id,
      texto: m.caption ?? "",
      // En los videos media_url es el video: la portada sale de thumbnail_url.
      imagenUrl: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? m.thumbnail_url ?? null,
      enlace: m.permalink!,
      fecha: fechaIso(m.timestamp),
    }));
}

type PostFb = {
  id: string;
  message?: string;
  story?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
};

export async function leerFacebook(con: ConexionMeta, limite = 10): Promise<PublicacionExterna[]> {
  const r = await graph<Respuesta<PostFb>>(
    `${con.pageId}/published_posts`,
    { fields: "id,message,created_time,permalink_url,full_picture", limit: String(limite) },
    con.pageToken,
  );
  return (r.data ?? [])
    .filter((p) => p.permalink_url)
    .map((p) => ({
      red: "facebook" as const,
      id: p.id,
      texto: p.message ?? "",
      imagenUrl: p.full_picture ?? null,
      enlace: p.permalink_url!,
      fecha: fechaIso(p.created_time),
    }));
}

/** Confirma que el token sigue vivo y devuelve a qué cuentas llega. */
export async function verificar(con: ConexionMeta) {
  const pagina = await graph<{ id: string; name: string }>(con.pageId, { fields: "id,name" }, con.pageToken);
  return { pagina: pagina.name, instagram: con.igUsuario };
}
