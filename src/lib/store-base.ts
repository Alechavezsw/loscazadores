import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Ajustes, Db, MetaDb, Noticia, PiezaSC } from "./types";

// DATA_DIR permite poner los datos en un disco persistente fuera de la carpeta del proyecto.
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export const AJUSTES_BASE: Ajustes = {
  lema: "Las noticias de tu barrio al instante",
  aviso:
    "Los Cazadores de Noticias es un medio de difusión de contenido enviado por la comunidad. Las opiniones y afirmaciones expresadas pertenecen a sus autores. Sitio destinado a personas mayores de 18 años.",
  whatsappCanal: "https://whatsapp.com/channel/0029Vb79Z1U59PwZ8JaRaW3v",
  instagram: "https://www.instagram.com/loscazadoresdenoticias/",
  facebook: "https://www.facebook.com/share/1FPFCTTbsg/",
  youtube: "",
  youtubeModo: "auto",
  youtubeVideoManual: "",
  whatsappContacto: "5492645105441",
  nombreVideos: "Sin censura",
  declaracion:
    "La noticia no es la que los medios nos imponen. La noticia es la que vivimos a diario en nuestro entorno y nos pone en alerta. Compartí la tuya.",
  historiaTitulo: "Tu historia también cuenta",
  historiaTexto: "Si algo pasó en tu barrio y querés comentarlo",
  tomateve: "",
  radioEnlace: "",
  sincronizar: true,
  sincronizarPublicar: true,
  sincronizarCategoria: "Comunidad",
  sincronizarCadaMin: 15,
};

export const META_BASE: MetaDb = {
  conexion: null,
  estado: { ultima: null },
  feeds: [],
  webhook: { claveHash: null, creada: null, recibidos: 0, eventos: [] },
};

export function newId() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

/** Videos de muestra para ver cómo queda la sección. Se borran desde el panel. */
export function piezasDeEjemplo(ahora = Date.now()): PiezaSC[] {
  const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();
  const base = { tipo: "video", imagen: null, destacada: false, publicada: true, ejemplo: true } as const;
  const crear = (n: number, p: Pick<PiezaSC, "titulo" | "cuerpo"> & Partial<PiezaSC>, minutos: number): PiezaSC => {
    // Ids fijos por la misma razón que las noticias de muestra.
    const id = `sc00000${n}`;
    return { ...base, id, slug: `${slugify(p.titulo)}-${id}`, creada: hace(minutos), actualizada: hace(minutos), ...p };
  };
  return [
    crear(
      1,
      {
        titulo: "Video de ejemplo: así se ve el video destacado",
        cuerpo:
          "Este es el video principal de la sección. Podés subir el archivo o pegar el enlace de YouTube, Facebook, Instagram, TikTok o Vimeo. Borralo desde el panel y cargá el tuyo.",
        destacada: true,
        incrustados: ["https://www.youtube.com/watch?v=jNQXAC9IVRw"],
      },
      90,
    ),
    crear(
      2,
      {
        titulo: "Otro video de ejemplo",
        cuerpo: "Los demás videos se ven al tocar «Ver todo».",
        incrustados: ["https://www.youtube.com/watch?v=jNQXAC9IVRw"],
      },
      60,
    ),
  ];
}

export function seed(): Db {
  const ahora = Date.now();
  const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();
  const base = {
    imagen: null,
    enlaces: {},
    urgente: false,
    destacada: false,
    publicada: true,
    ejemplo: true,
    zona: "",
  } as const;
  let n = 0;
  const crear = (
    titulo: string,
    cuerpo: string,
    categoria: string,
    canales: Noticia["canales"],
    minutos: number,
    extra: Partial<Noticia> = {},
  ): Noticia => {
    // Ids fijos: las lecturas en caché tienen que coincidir entre sí mientras no exista db.json.
    const id = `ej00000${++n}`;
    return {
      ...base,
      enlaces: {},
      id,
      slug: `${slugify(titulo)}-${id}`,
      titulo,
      cuerpo,
      categoria,
      canales,
      creada: hace(minutos),
      actualizada: hace(minutos),
      ...extra,
    };
  };

  return {
    ajustes: { ...AJUSTES_BASE },
    meta: structuredClone(META_BASE),
    anuncios: [],
    sinCensura: piezasDeEjemplo(ahora),
    noticias: [
      crear(
        "Vecinos de Chimbas reclaman por luminarias",
        "La falta de iluminación en varias calles genera preocupación entre los vecinos, quienes piden una solución urgente.\n\nSegún cuentan, el problema se repite desde hace semanas y a la noche el barrio queda a oscuras. Si pasás por la zona, mandanos tu foto o tu video para sumar al reclamo.",
        "Barrio",
        ["facebook"],
        180,
        { zona: "Chimbas", urgente: true, destacada: true },
      ),
      crear(
        "Vecinos reclaman por el estado de la calle en el barrio",
        "Nos enviaron estas imágenes del estado en que se encuentra la calle. Los vecinos piden una solución urgente.\n\nSi es tu barrio, contanos cómo está la situación en tu cuadra.",
        "Barrio",
        ["whatsapp"],
        120,
        { zona: "Rivadavia" },
      ),
      crear(
        "Así se encuentra el barrio tras la tormenta",
        "Así se encuentra el barrio tras la tormenta. Los vecinos nos enviaron estas imágenes.\n\n¿Conocés esta zona? Contanos tu experiencia en los comentarios.",
        "Clima",
        ["instagram"],
        75,
        { zona: "San Juan" },
      ),
      crear(
        "Los Cazadores de Noticias en vivo",
        "Las noticias del barrio al instante.",
        "Comunidad",
        ["youtube"],
        40,
      ),
      crear(
        "Se viene la sexta edición de Viva Feria",
        "Viva Feria – Espacio de Emprendedores prepara su sexta edición. Acá van a aparecer la fecha, el lugar y todo lo que hay que saber para ir.\n\nNota de ejemplo: editala o borrala desde el panel.",
        "Eventos",
        [],
        50,
        { espacio: "viva-feria" },
      ),
      crear(
        "Así pasó la sexta edición de Viva Feria en el Salón El Prado",
        "Fotos, videos y lo que dejó la sexta edición de Viva Feria. Cada edición se cuenta en una nota nueva en este mismo espacio.\n\nNota de ejemplo: editala o borrala desde el panel.",
        "Eventos",
        [],
        45,
        { espacio: "viva-feria" },
      ),
      crear(
        "Novedades de servicios",
        "Acá se publican los anuncios y la información de servicios.\n\nNota de ejemplo: editala o borrala desde el panel.",
        "Servicios",
        [],
        30,
        { espacio: "si-san-juan" },
      ),
      crear(
        "Cómo mandarnos tu noticia, tus fotos y tus videos",
        "Cualquier vecino puede sumar su noticia. Escribinos por WhatsApp con una foto o un video, contá qué pasó, dónde y a qué hora, y nosotros la revisamos antes de publicarla.\n\nNo hace falta que sea algo grande: un bache, una luminaria apagada o un vecino que necesita una mano también es noticia.",
        "Servicios",
        ["whatsapp", "instagram", "facebook"],
        20,
      ),
    ],
  };
}

/** Completa lo que falte de una base guardada con una versión anterior del sitio. */
export function completar(db: Partial<Db> | null | undefined): Db {
  return {
    noticias: db?.noticias ?? [],
    sinCensura: db?.sinCensura ?? [],
    anuncios: db?.anuncios ?? [],
    ajustes: { ...AJUSTES_BASE, ...(db?.ajustes ?? {}) },
    meta: {
      conexion: db?.meta?.conexion ?? null,
      estado: { ...META_BASE.estado, ...(db?.meta?.estado ?? {}) },
      feeds: db?.meta?.feeds ?? [],
      webhook: { ...structuredClone(META_BASE.webhook), ...(db?.meta?.webhook ?? {}) },
    },
  };
}

/** Dirección de la base Postgres. La integración de Neon en Vercel la define sola. */
export function urlPostgres() {
  if (process.env.ALMACEN === "archivo") return "";
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

/** Contrato que cumplen los dos motores de almacenamiento. */
export type Motor = {
  /** Lo guardado, o null si todavía no se guardó nada (el sitio muestra entonces el contenido de muestra). */
  leer(): Promise<Db | null>;
  /** Solo ajustes y conexiones: es mucho más liviano que leer todas las noticias. */
  leerConfig(): Promise<Pick<Db, "ajustes" | "meta"> | null>;
  /** Aplica un cambio de a uno por vez, también entre varias instancias del servidor, y lo guarda completo o nada. */
  mutar<T>(cambio: (db: Db) => T | Promise<T>): Promise<T>;
};
