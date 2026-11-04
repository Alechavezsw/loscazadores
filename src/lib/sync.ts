import "server-only";
import { ErrorFeed, leerFeed } from "./feeds";
import { borrarImagen, guardarImagenDesdeUrl } from "./images";
import { ErrorMeta, leerFacebook, leerInstagram, type PublicacionExterna } from "./meta";
import { mutateDb, newId, readDb, slugify } from "./store";
import { CATEGORIAS, type Db, type Noticia, type ResultadoRed } from "./types";
import { normalizarEnlace } from "./urls";

type Red = PublicacionExterna["red"];

const POR_RED = 10;
const NOMBRE_RED: Record<Red, string> = { instagram: "Instagram", facebook: "Facebook" };
const VENTANA_FUSION_MS = 48 * 3600_000;

// ───────────────────────── textos ─────────────────────────

const SOLO_ETIQUETAS = /^(\s*[#@][\p{L}\p{N}_.]+\s*)+$/u;

/** Primera línea con contenido, sin etiquetas ni enlaces, recortada en un corte natural. */
export function tituloDe(texto: string, red: Red): string {
  const lineas = texto
    .replace(/https?:\/\/\S+/g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !SOLO_ETIQUETAS.test(l));
  let t = lineas[0] ?? "";
  if (t.length > 100) {
    const corte = t.slice(0, 100);
    const punto = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
    t = punto > 40 ? corte.slice(0, punto + 1) : `${corte.replace(/\s+\S*$/, "")}…`;
  }
  return t || `Publicación de ${NOMBRE_RED[red]}`;
}

/** Texto completo sin el bloque final de etiquetas, con cada línea como párrafo. */
export function cuerpoDe(texto: string, red: Red): string {
  const lineas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  while (lineas.length > 0 && SOLO_ETIQUETAS.test(lineas[lineas.length - 1])) lineas.pop();
  return lineas.join("\n\n") || `Mirá la publicación original en ${NOMBRE_RED[red]}.`;
}

/** Huella del comienzo del texto. Sirve para reconocer el mismo contenido publicado en dos redes. */
export function claveContenido(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 80);
}

export { normalizarEnlace };

// ───────────────────────── núcleo de importación ─────────────────────────

function yaImportada(noticias: Noticia[], p: PublicacionExterna) {
  const enlace = normalizarEnlace(p.enlace);
  return noticias.some((n) => n.externos?.[p.red] === p.id || (enlace && normalizarEnlace(n.enlaces[p.red]) === enlace));
}

function buscarGemela(noticias: Noticia[], p: PublicacionExterna) {
  const clave = claveContenido(p.texto);
  if (clave.length < 20) return undefined;
  const t = Date.parse(p.fecha);
  return noticias.find(
    (n) =>
      (n.origen === "instagram" || n.origen === "facebook") &&
      n.origen !== p.red &&
      !n.canales.includes(p.red) &&
      claveContenido(n.cuerpo) === clave &&
      Math.abs(Date.parse(n.creada) - t) < VENTANA_FUSION_MS,
  );
}

export type EstadoImportacion = "nueva" | "unida" | "repetida";

export type ResumenImportacion = {
  nuevas: number;
  fusionadas: number;
  repetidas: number;
  detalle: Array<{ post: PublicacionExterna; estado: EstadoImportacion }>;
};

/**
 * Convierte publicaciones de cualquier origen (API de Meta, feeds, avisos) en noticias: baja las fotos,
 * no repite lo ya importado y une lo que salió igual en las dos redes. `alGuardar` corre dentro de la
 * misma escritura, para dejar anotado el resultado sin una segunda pasada por el disco.
 */
export async function importarPublicaciones(
  posts: PublicacionExterna[],
  alGuardar?: (db: Db, resumen: ResumenImportacion) => void,
): Promise<ResumenImportacion> {
  const unicas = [...new Map(posts.map((p) => [`${p.red}:${p.id}`, p])).values()];
  const inicial = await readDb();

  // Las fotos se bajan antes de tocar la base y solo de lo que todavía no está.
  const pendientes = unicas
    .filter((p) => !yaImportada(inicial.noticias, p))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const fotos = new Map<PublicacionExterna, string | null>();
  for (const p of pendientes) fotos.set(p, await guardarImagenDesdeUrl(p.imagenUrl));

  const resumen: ResumenImportacion = { nuevas: 0, fusionadas: 0, repetidas: 0, detalle: [] };
  const sobrantes: string[] = [];
  const ahora = new Date().toISOString();
  const aImportar = new Set(pendientes);

  await mutateDb((db) => {
    const categoria = (CATEGORIAS as readonly string[]).includes(db.ajustes.sincronizarCategoria)
      ? db.ajustes.sincronizarCategoria
      : "Comunidad";

    for (const p of unicas) {
      if (!aImportar.has(p)) {
        resumen.repetidas++;
        resumen.detalle.push({ post: p, estado: "repetida" });
      }
    }

    for (const p of pendientes) {
      const foto = fotos.get(p) ?? null;

      // Pudo importarla otra corrida o cargarla alguien a mano mientras se bajaban las fotos.
      if (yaImportada(db.noticias, p)) {
        if (foto) sobrantes.push(foto);
        resumen.repetidas++;
        resumen.detalle.push({ post: p, estado: "repetida" });
        continue;
      }

      const gemela = buscarGemela(db.noticias, p);
      if (gemela) {
        gemela.canales = [...gemela.canales, p.red];
        gemela.enlaces = { ...gemela.enlaces, [p.red]: p.enlace };
        gemela.externos = { ...gemela.externos, [p.red]: p.id };
        gemela.actualizada = ahora;
        if (foto) {
          if (gemela.imagen) sobrantes.push(foto);
          else gemela.imagen = foto;
        }
        resumen.fusionadas++;
        resumen.detalle.push({ post: p, estado: "unida" });
        continue;
      }

      const id = newId();
      const titulo = tituloDe(p.texto, p.red);
      db.noticias.push({
        id,
        slug: `${slugify(titulo) || p.red}-${id}`,
        titulo,
        cuerpo: cuerpoDe(p.texto, p.red),
        categoria,
        zona: "",
        imagen: foto,
        canales: [p.red],
        enlaces: { [p.red]: p.enlace },
        urgente: false,
        destacada: false,
        publicada: db.ajustes.sincronizarPublicar,
        ejemplo: false,
        creada: p.fecha,
        actualizada: ahora,
        origen: p.red,
        externos: { [p.red]: p.id },
      });
      resumen.nuevas++;
      resumen.detalle.push({ post: p, estado: "nueva" });
    }

    alGuardar?.(db, resumen);
  });

  await Promise.all(sobrantes.map(borrarImagen));
  return resumen;
}

// ───────────────────────── API de Meta ─────────────────────────

export type ResultadoSync = {
  nuevas: number;
  fusionadas: number;
  instagram?: ResultadoRed;
  facebook?: ResultadoRed;
};

let enCurso: Promise<ResultadoSync> | null = null;

/** Importa lo nuevo de Instagram y Facebook por la API. Si ya hay una corrida en marcha, comparte su resultado. */
export function sincronizar(): Promise<ResultadoSync> {
  enCurso ??= ejecutar().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function ejecutar(): Promise<ResultadoSync> {
  const inicial = await readDb();
  const con = inicial.meta.conexion;
  if (!con) throw new ErrorMeta("Todavía no hay una cuenta de Meta conectada.");

  const resultados: Partial<Record<Red, ResultadoRed>> = {};
  const traidas: PublicacionExterna[] = [];
  let reconectar = false;

  const fuentes: Array<[Red, (limite: number) => Promise<PublicacionExterna[]>]> = [
    ["instagram", (n) => leerInstagram(con, n)],
    ["facebook", (n) => leerFacebook(con, n)],
  ];
  for (const [red, leer] of fuentes) {
    if (red === "instagram" && !con.igId) continue;
    resultados[red] = { nuevas: 0, fusionadas: 0 };
    try {
      traidas.push(...(await leer(POR_RED)));
    } catch (e) {
      const meta = e instanceof ErrorMeta ? e : null;
      resultados[red]!.error = meta?.message ?? "Falló la lectura por un error inesperado.";
      if (meta?.reconectar) reconectar = true;
    }
  }

  await importarPublicaciones(traidas, (db, r) => {
    for (const { post, estado } of r.detalle) {
      const res = resultados[post.red];
      if (!res) continue;
      if (estado === "nueva") res.nuevas++;
      if (estado === "unida") res.fusionadas++;
    }
    db.meta.estado = {
      ultima: new Date().toISOString(),
      instagram: resultados.instagram,
      facebook: resultados.facebook,
      reconectar,
    };
  });

  return {
    nuevas: (resultados.instagram?.nuevas ?? 0) + (resultados.facebook?.nuevas ?? 0),
    fusionadas: (resultados.instagram?.fusionadas ?? 0) + (resultados.facebook?.fusionadas ?? 0),
    instagram: resultados.instagram,
    facebook: resultados.facebook,
  };
}

// ───────────────────────── feeds ─────────────────────────

export type ResultadoFeed = { nuevas: number; fusionadas: number; error?: string };

const feedsEnCurso = new Map<string, Promise<ResultadoFeed>>();

/** Lee un feed guardado e importa lo nuevo. El resultado queda anotado en el propio feed. */
export function sincronizarFeed(id: string): Promise<ResultadoFeed> {
  let corrida = feedsEnCurso.get(id);
  if (!corrida) {
    corrida = ejecutarFeed(id).finally(() => feedsEnCurso.delete(id));
    feedsEnCurso.set(id, corrida);
  }
  return corrida;
}

async function ejecutarFeed(id: string): Promise<ResultadoFeed> {
  const { meta } = await readDb();
  const feed = meta.feeds.find((f) => f.id === id);
  if (!feed) throw new ErrorFeed("Ese enlace de feed ya no existe.");

  let posts: PublicacionExterna[] = [];
  let error: string | undefined;
  try {
    posts = await leerFeed(feed.url, feed.red);
  } catch (e) {
    error = e instanceof ErrorFeed ? e.message : "No se pudo leer el feed.";
  }

  const r = await importarPublicaciones(posts, (db, res) => {
    const f = db.meta.feeds.find((x) => x.id === id);
    if (!f) return;
    f.ultima = new Date().toISOString();
    f.nuevas = res.nuevas;
    f.fusionadas = res.fusionadas;
    f.error = error;
  });
  return { nuevas: r.nuevas, fusionadas: r.fusionadas, error };
}
