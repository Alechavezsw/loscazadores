import { incrustar } from "./embeds";

/**
 * El texto de una noticia escrito con el editor: párrafos con formato, subtítulos, listas, citas y, entre medio,
 * fotos, videos subidos y publicaciones incrustadas. Se guarda como un árbol de bloques (el mismo formato que usa
 * el editor), nunca como HTML: así no hay forma de que se publique código ajeno.
 *
 * La noticia sigue teniendo su `cuerpo` en texto plano, que se arma a partir de esto y es lo que usan los
 * resúmenes, las tarjetas y las redes. Las notas viejas o importadas no tienen `contenido` y se muestran como antes.
 */

export type Marca = { type: "bold" | "italic" | "underline" | "strike" } | { type: "link"; attrs: { href: string } };
export type Tramo = { type: "text"; text: string; marks?: Marca[] } | { type: "hardBreak" };

export type Parrafo = { type: "paragraph"; content?: Tramo[] };
export type Lista = { type: "bulletList" | "orderedList"; content: ItemLista[] };
export type ItemLista = { type: "listItem"; content: Array<Parrafo | Lista> };

export type Bloque =
  | Parrafo
  | { type: "heading"; attrs: { level: 2 | 3 }; content?: Tramo[] }
  | { type: "blockquote"; content: Parrafo[] }
  | Lista
  | { type: "foto"; attrs: { src: string; epigrafe: string } }
  | { type: "video"; attrs: { src: string } }
  | { type: "incrustado"; attrs: { url: string } };

export type Contenido = { type: "doc"; content: Bloque[] };

export const MAX_FOTOS = 30;
export const MAX_VIDEOS = 6;
export const MAX_INCRUSTADOS_TEXTO = 10;
const MAX_EPIGRAFE = 200;
const MAX_BLOQUES = 400;
const MARCAS_SIMPLES = new Set(["bold", "italic", "underline", "strike"]);

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const hijos = (v: Obj): unknown[] => (Array.isArray(v.content) ? v.content : []);
const attrs = (v: Obj): Obj => (esObj(v.attrs) ? v.attrs : {});

/** Un enlace del texto: solo web, correo o teléfono. Sin protocolo se asume https. */
export function enlaceSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (!v || v.length > 2000) return null;
  if (/^(mailto:|tel:)[^\s<>"']+$/i.test(v)) return v;
  const conProtocolo = /^https?:\/\//i.test(v) ? v : /^[a-z][a-z0-9+.-]*:/i.test(v) ? "" : `https://${v}`;
  if (!conProtocolo) return null;
  try {
    const u = new URL(conProtocolo);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

function limpiarTramos(lista: unknown[]): Tramo[] {
  const salida: Tramo[] = [];
  for (const t of lista) {
    if (!esObj(t)) continue;
    if (t.type === "hardBreak") {
      salida.push({ type: "hardBreak" });
      continue;
    }
    if (t.type !== "text" || typeof t.text !== "string" || t.text.length === 0) continue;
    const marcas: Marca[] = [];
    for (const m of Array.isArray(t.marks) ? t.marks : []) {
      if (!esObj(m) || typeof m.type !== "string") continue;
      if (MARCAS_SIMPLES.has(m.type)) {
        if (!marcas.some((x) => x.type === m.type)) marcas.push({ type: m.type } as Marca);
      } else if (m.type === "link") {
        const href = enlaceSeguro(attrs(m).href);
        if (href && !marcas.some((x) => x.type === "link")) marcas.push({ type: "link", attrs: { href } });
      }
    }
    salida.push(marcas.length > 0 ? { type: "text", text: t.text, marks: marcas } : { type: "text", text: t.text });
  }
  return salida;
}

function limpiarParrafo(b: Obj): Parrafo {
  const tramos = limpiarTramos(hijos(b));
  return tramos.length > 0 ? { type: "paragraph", content: tramos } : { type: "paragraph" };
}

function limpiarLista(b: Obj, nivel: number): Lista | null {
  const items: ItemLista[] = [];
  for (const it of hijos(b)) {
    if (!esObj(it) || it.type !== "listItem") continue;
    const dentro: ItemLista["content"] = [];
    for (const h of hijos(it)) {
      if (!esObj(h)) continue;
      if (h.type === "paragraph") dentro.push(limpiarParrafo(h));
      else if ((h.type === "bulletList" || h.type === "orderedList") && nivel < 3) {
        const sub = limpiarLista(h, nivel + 1);
        if (sub) dentro.push(sub);
      }
    }
    if (dentro.length > 0) items.push({ type: "listItem", content: dentro });
  }
  return items.length > 0 ? { type: b.type as Lista["type"], content: items } : null;
}

export type Validadores = {
  /** ¿Es una foto nuestra (nombre de archivo o dirección de nuestro almacenamiento)? */
  foto: (valor: string) => boolean;
  video: (valor: string) => boolean;
};

/**
 * Rearma el contenido que manda el editor dejando solo lo que se conoce: cualquier bloque, marca o atributo que no
 * esté en la lista se descarta. Devuelve null si lo recibido no tiene forma de contenido.
 */
export function limpiarContenido(crudo: unknown, validar: Validadores): { doc: Contenido; errores: string[] } | null {
  if (!esObj(crudo) || crudo.type !== "doc") return null;
  const bloques: Bloque[] = [];
  const errores: string[] = [];
  let fotos = 0;
  let videos = 0;
  let incrustados = 0;

  for (const b of hijos(crudo).slice(0, MAX_BLOQUES)) {
    if (!esObj(b)) continue;
    const a = attrs(b);
    switch (b.type) {
      case "paragraph": {
        // Los párrafos vacíos son espacio que dejó el editor (por ejemplo, después de una foto): no se guardan.
        const p = limpiarParrafo(b);
        if (p.content) bloques.push(p);
        break;
      }
      case "heading": {
        const tramos = limpiarTramos(hijos(b));
        if (tramos.length > 0) bloques.push({ type: "heading", attrs: { level: a.level === 3 ? 3 : 2 }, content: tramos });
        break;
      }
      case "blockquote": {
        const dentro = hijos(b)
          .filter((h): h is Obj => esObj(h) && h.type === "paragraph")
          .map(limpiarParrafo);
        if (dentro.length > 0) bloques.push({ type: "blockquote", content: dentro });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const lista = limpiarLista(b, 1);
        if (lista) bloques.push(lista);
        break;
      }
      case "foto": {
        const src = typeof a.src === "string" ? a.src : "";
        if (!validar.foto(src)) {
          errores.push("Una de las fotos del texto no es válida. Quitala y subila de nuevo.");
          break;
        }
        if (++fotos > MAX_FOTOS) break;
        const epigrafe = typeof a.epigrafe === "string" ? a.epigrafe.replace(/\s+/g, " ").trim().slice(0, MAX_EPIGRAFE) : "";
        bloques.push({ type: "foto", attrs: { src, epigrafe } });
        break;
      }
      case "video": {
        const src = typeof a.src === "string" ? a.src : "";
        if (!validar.video(src)) {
          errores.push("Uno de los videos del texto no es válido. Quitalo y subilo de nuevo.");
          break;
        }
        if (++videos > MAX_VIDEOS) break;
        bloques.push({ type: "video", attrs: { src } });
        break;
      }
      case "incrustado": {
        const e = incrustar(typeof a.url === "string" ? a.url : "");
        if (!e) {
          errores.push("Uno de los enlaces incrustados en el texto no se reconoce. Sirven YouTube, Vimeo, TikTok, Facebook e Instagram.");
          break;
        }
        if (++incrustados > MAX_INCRUSTADOS_TEXTO) break;
        bloques.push({ type: "incrustado", attrs: { url: e.url } });
        break;
      }
    }
  }

  if (fotos > MAX_FOTOS) errores.push(`El texto puede llevar hasta ${MAX_FOTOS} fotos.`);
  if (videos > MAX_VIDEOS) errores.push(`El texto puede llevar hasta ${MAX_VIDEOS} videos subidos. Para más, subilos a YouTube e incrustalos.`);
  if (incrustados > MAX_INCRUSTADOS_TEXTO) errores.push(`El texto puede llevar hasta ${MAX_INCRUSTADOS_TEXTO} enlaces incrustados.`);

  return { doc: { type: "doc", content: bloques }, errores };
}

const textoDeTramos = (tramos: Tramo[] | undefined) => (tramos ?? []).map((t) => (t.type === "text" ? t.text : "\n")).join("");

function textoDeLista(l: Lista, sangria = ""): string {
  return l.content
    .map((it, i) => {
      const marca = l.type === "orderedList" ? `${i + 1}. ` : "• ";
      return it.content
        .map((h, j) => (h.type === "paragraph" ? `${sangria}${j === 0 ? marca : "  "}${textoDeTramos(h.content)}` : textoDeLista(h, `${sangria}  `)))
        .join("\n");
    })
    .join("\n");
}

/** El texto plano de la nota, con los párrafos separados por una línea en blanco (como el `cuerpo` de siempre). */
export function textoPlano(doc: Contenido): string {
  const partes: string[] = [];
  for (const b of doc.content) {
    if (b.type === "paragraph" || b.type === "heading") partes.push(textoDeTramos(b.content));
    else if (b.type === "blockquote") partes.push(b.content.map((p) => textoDeTramos(p.content)).join("\n"));
    else if (b.type === "bulletList" || b.type === "orderedList") partes.push(textoDeLista(b));
    else if (b.type === "foto" && b.attrs.epigrafe) partes.push(b.attrs.epigrafe);
  }
  return partes
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Las fotos, los videos subidos y los enlaces incrustados que lleva el texto. */
export function mediosDe(doc: Contenido | null | undefined) {
  const fotos: string[] = [];
  const videos: string[] = [];
  const incrustados: string[] = [];
  for (const b of doc?.content ?? []) {
    if (b.type === "foto") fotos.push(b.attrs.src);
    else if (b.type === "video") videos.push(b.attrs.src);
    else if (b.type === "incrustado") incrustados.push(b.attrs.url);
  }
  return { fotos, videos, incrustados };
}

/** Arma el contenido del editor a partir del texto plano de una nota vieja o importada: un párrafo por bloque. */
export function contenidoDesdeTexto(texto: string): Contenido {
  const bloques: Bloque[] = texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const tramos: Tramo[] = [];
      p.split("\n").forEach((linea, i) => {
        if (i > 0) tramos.push({ type: "hardBreak" });
        if (linea) tramos.push({ type: "text", text: linea });
      });
      return { type: "paragraph", content: tramos };
    });
  return { type: "doc", content: bloques };
}
