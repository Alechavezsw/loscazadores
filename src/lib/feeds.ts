import "server-only";
import { XMLParser } from "fast-xml-parser";
import { ErrorRed, fetchPublico } from "./red";
import type { PublicacionExterna } from "./meta";

/**
 * Lectura de publicaciones desde cualquier fuente que no sea la API de Meta:
 * feeds (Behold, JSON Feed, RSS, Atom) y avisos de Make o Zapier. Todo pasa por
 * publicacionDesdeObjeto, que reconoce los nombres de campo más comunes.
 */

export class ErrorFeed extends Error {}

type Obj = Record<string, unknown>;
type Red = PublicacionExterna["red"];

const MAX_FEED_BYTES = 3 * 1024 * 1024;
const MAX_ITEMS = 30;

// ───────────────────────── utilidades ─────────────────────────

const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

function indice(o: Obj) {
  const m = new Map<string, unknown>();
  for (const [k, v] of Object.entries(o)) if (!m.has(norm(k))) m.set(norm(k), v);
  return m;
}

/** Cualquier valor simple como texto. Los nodos XML con atributos guardan el texto en "#text". */
function aTexto(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const t = (v as Obj)["#text"];
    return typeof t === "string" || typeof t === "number" ? String(t).trim() : "";
  }
  return "";
}

function primero(m: Map<string, unknown>, claves: string[]) {
  for (const c of claves) {
    const t = aTexto(m.get(c));
    if (t) return t;
  }
  return "";
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodificar(texto: string) {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m);
}

export function htmlATexto(html: string) {
  return decodificar(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const tieneHtml = (t: string) => /<[a-z!/][^>]*>/i.test(t);

function imagenEnHtml(html: string) {
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "";
}

export function inferirRed(url: string): Red | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (/(^|\.)(instagram\.com|instagr\.am)$/.test(host)) return "instagram";
    if (/(^|\.)(facebook\.com|fb\.com|fb\.watch)$/.test(host)) return "facebook";
  } catch {
    // Se informa más arriba.
  }
  return null;
}

function aFecha(v: string): string {
  if (!v) return new Date().toISOString();
  let t: number;
  if (/^\d{9,13}$/.test(v)) t = Number(v) < 1e11 ? Number(v) * 1000 : Number(v);
  else t = Date.parse(v.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
}

function esUrlHttp(v: string) {
  return /^https?:\/\/[^\s]+$/i.test(v);
}

// ───────────────────────── normalizador ─────────────────────────

const CLAVES_TITULO = ["title", "titulo", "headline"];
const CLAVES_TEXTO = [
  "caption",
  "message",
  "texto",
  "text",
  "contenttext",
  "content",
  "contenthtml",
  "contentencoded",
  "description",
  "descripcion",
  "summary",
  "body",
];
const CLAVES_ENLACE = ["permalink", "permalinkurl", "url", "link", "enlace", "postlink", "externalurl", "linkurl", "href"];
const CLAVES_IMAGEN = [
  "mediaurl",
  "fullpicture",
  "picture",
  "imageurl",
  "image",
  "imagen",
  "bannerimage",
  "photo",
  "foto",
  "thumbnailurl",
  "thumbnail",
];
const CLAVES_ID = ["id", "postid", "guid", "externalid", "idexterno"];
const CLAVES_FECHA = [
  "timestamp",
  "createdtime",
  "datepublished",
  "published",
  "pubdate",
  "publishedat",
  "date",
  "fecha",
  "createdat",
  "created",
  "updated",
];
const CLAVES_RED = ["red", "network", "platform", "plataforma", "source"];

/** Behold entrega varios tamaños de la misma foto: se usa el grande, que alcanza para la nota. */
function imagenDeTamanios(m: Map<string, unknown>) {
  const sizes = m.get("sizes");
  if (!sizes || typeof sizes !== "object") return "";
  const s = indice(sizes as Obj);
  for (const t of ["large", "medium", "full", "small"]) {
    const o = s.get(t);
    const u = o && typeof o === "object" ? aTexto((o as Obj).mediaUrl) : "";
    if (u) return u;
  }
  return "";
}

/** JSON Feed trae las fotos en "attachments". */
function imagenDeAdjuntos(m: Map<string, unknown>) {
  const adj = m.get("attachments");
  if (!Array.isArray(adj)) return "";
  for (const a of adj) {
    if (!a || typeof a !== "object") continue;
    const o = indice(a as Obj);
    if (primero(o, ["mimetype"]).startsWith("image/")) return primero(o, ["url"]);
  }
  return "";
}

function combinar(titulo: string, cuerpo: string) {
  if (!titulo) return cuerpo;
  if (!cuerpo) return titulo;
  // Si el cuerpo ya empieza con el título (algo muy común) no se repite.
  return cuerpo.startsWith(titulo.slice(0, 30)) ? cuerpo : `${titulo}\n\n${cuerpo}`;
}

/** Convierte un objeto cualquiera (de un feed o de un aviso) en una publicación. */
export function publicacionDesdeObjeto(o: Obj, redPorDefecto?: Red): PublicacionExterna | { error: string } {
  const m = indice(o);

  const enlaceCrudo = primero(m, CLAVES_ENLACE);
  const enlace = esUrlHttp(enlaceCrudo) ? enlaceCrudo : "";
  if (!enlace) return { error: "Falta el enlace de la publicación (campo enlace, permalink o url)." };

  const declarada = primero(m, CLAVES_RED).toLowerCase();
  const red: Red | undefined =
    inferirRed(enlace) ??
    (declarada.includes("insta") ? "instagram" : declarada.includes("face") || declarada === "fb" ? "facebook" : undefined) ??
    redPorDefecto;
  if (!red) return { error: 'No se pudo saber si es de Instagram o de Facebook. Agregá el campo "red".' };

  let titulo = primero(m, CLAVES_TITULO);
  let cuerpo = primero(m, CLAVES_TEXTO);
  let imagenHtml = "";
  if (tieneHtml(cuerpo)) {
    imagenHtml = imagenEnHtml(cuerpo);
    cuerpo = htmlATexto(cuerpo);
  }
  if (tieneHtml(titulo)) titulo = htmlATexto(titulo);
  const texto = combinar(decodificar(titulo), cuerpo);

  const tipoMedia = primero(m, ["mediatype"]).toUpperCase();
  const esVideo = tipoMedia === "VIDEO" || tipoMedia === "REELS";
  let imagen = esVideo
    ? primero(m, ["thumbnailurl", "thumbnail", "imageurl", "image", "picture", "fullpicture"]) || imagenDeTamanios(m)
    : imagenDeTamanios(m) || primero(m, CLAVES_IMAGEN) || imagenDeAdjuntos(m);
  if (!imagen) imagen = imagenHtml;
  // Si lo único que hay es el video en sí, no sirve de portada.
  if (!esHttpImagen(imagen)) imagen = "";

  const id = (primero(m, CLAVES_ID) || enlace).slice(0, 300);

  return {
    red,
    id,
    texto,
    imagenUrl: imagen || null,
    enlace,
    fecha: aFecha(primero(m, CLAVES_FECHA)),
  };
}

function esHttpImagen(v: string) {
  return esUrlHttp(v) && !/\.(mp4|mov|m3u8|webm)(\?|$)/i.test(v);
}

/** Un aviso puede traer una publicación suelta, una lista o un objeto con la lista adentro. */
export function objetosDeAviso(carga: unknown): Obj[] {
  if (Array.isArray(carga)) return carga.filter((x): x is Obj => !!x && typeof x === "object" && !Array.isArray(x));
  if (carga && typeof carga === "object") {
    const o = carga as Obj;
    for (const k of ["posts", "items", "data", "entries", "publicaciones"]) {
      if (Array.isArray(o[k])) return objetosDeAviso(o[k]);
    }
    return [o];
  }
  return [];
}

// ───────────────────────── feeds ─────────────────────────

const asArray = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function urlDeAdjunto(v: unknown): string {
  for (const x of asArray(v)) {
    if (!x || typeof x !== "object") continue;
    const o = x as Obj;
    const tipo = `${aTexto(o["@_type"])} ${aTexto(o["@_medium"])}`;
    if (/video/i.test(tipo)) continue;
    const u = aTexto(o["@_url"]);
    if (u) return u;
  }
  return "";
}

function itemsDeXml(xml: string): Obj[] {
  let doc: Obj;
  try {
    doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" }).parse(xml) as Obj;
  } catch {
    throw new ErrorFeed("Ese enlace no devuelve un feed válido.");
  }

  const rss = doc.rss as Obj | undefined;
  const atom = doc.feed as Obj | undefined;
  const rdf = doc["rdf:RDF"] as Obj | undefined;

  if (rss?.channel || rdf) {
    const crudos = asArray(((rss?.channel as Obj | undefined)?.item ?? rdf?.item) as Obj | Obj[] | undefined);
    return crudos.map((it) => ({
      title: aTexto(it.title),
      content: aTexto(it["content:encoded"]) || aTexto(it.description),
      url: aTexto(it.link),
      id: aTexto(it.guid),
      date: aTexto(it.pubDate) || aTexto(it["dc:date"]),
      image: urlDeAdjunto(it.enclosure) || urlDeAdjunto(it["media:content"]) || urlDeAdjunto(it["media:thumbnail"]),
    }));
  }

  if (atom) {
    return asArray(atom.entry as Obj | Obj[] | undefined).map((e) => {
      const enlaces = asArray(e.link as Obj | Obj[] | undefined);
      const alterno = enlaces.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? enlaces[0];
      return {
        title: aTexto(e.title),
        content: aTexto(e.content) || aTexto(e.summary),
        url: aTexto(alterno?.["@_href"]),
        id: aTexto(e.id),
        date: aTexto(e.published) || aTexto(e.updated),
        image: urlDeAdjunto(e["media:thumbnail"]) || urlDeAdjunto(e["media:content"]),
      };
    });
  }

  throw new ErrorFeed("Ese enlace no es un feed RSS ni Atom.");
}

/** Interpreta el contenido de un feed (JSON o XML) y devuelve sus publicaciones más recientes. */
export function parsearFeed(contenido: string, redPorDefecto: Red): PublicacionExterna[] {
  const t = contenido.replace(/^﻿/, "").trim();
  let items: Obj[];
  if (t.startsWith("<")) {
    items = itemsDeXml(t);
  } else {
    let json: unknown;
    try {
      json = JSON.parse(t);
    } catch {
      throw new ErrorFeed("Ese enlace no devuelve un feed válido: no es JSON ni RSS.");
    }
    items = objetosDeAviso(json);
  }

  const posts: PublicacionExterna[] = [];
  for (const it of items.slice(0, MAX_ITEMS)) {
    const r = publicacionDesdeObjeto(it, redPorDefecto);
    if (!("error" in r)) posts.push(r);
  }
  if (items.length > 0 && posts.length === 0) {
    throw new ErrorFeed(
      `El feed tiene ${items.length} elementos pero ninguno trae el enlace de la publicación, así que no se pueden importar.`,
    );
  }
  return posts;
}

export async function leerFeed(url: string, redPorDefecto: Red): Promise<PublicacionExterna[]> {
  try {
    const { datos } = await fetchPublico(url, {
      maxBytes: MAX_FEED_BYTES,
      accept: "application/json, application/feed+json, application/rss+xml, application/atom+xml, text/xml, */*;q=0.5",
    });
    return parsearFeed(datos.toString("utf8"), redPorDefecto);
  } catch (e) {
    if (e instanceof ErrorFeed) throw e;
    if (e instanceof ErrorRed) throw new ErrorFeed(e.message);
    throw new ErrorFeed("No se pudo leer el feed. Probá de nuevo en un rato.");
  }
}
