import type { Contenido } from "./contenido";

export const CANALES = ["whatsapp", "instagram", "facebook", "youtube"] as const;
export type Canal = (typeof CANALES)[number];

export const CANAL_NOMBRE: Record<Canal, string> = {
  whatsapp: "Canal de WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
};

export const CATEGORIAS = [
  "Barrio",
  "Policiales",
  "Política",
  "Deportes",
  "Clima",
  "Servicios",
  "Servicios Sociales",
  "Comunidad",
  "Solidario",
  "Eventos",
  "Carta Abierta",
  "Entrevista",
  "Tapá mi número",
  "Cartas de la Vieja Pocha",
  "Espectáculos",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/**
 * Las secciones del sitio, en el orden en que se muestran en el menú. Casi todas son una categoría de la noticia y
 * tienen su propia página (/secciones/<slug>) con todas las notas de esa categoría. Los textos de «bajada» son
 * provisorios (salvo los que dio el cliente): se ajustan acá.
 */
export type Seccion = {
  slug: string;
  nombre: string;
  bajada: string;
  /** Otras categorías cuyas notas también van en esta sección, además de la que lleva su mismo nombre. */
  tambien?: readonly Categoria[];
  /** «medios»: en vez de notas, muestra logos y enlaces de medios aliados (se cargan desde el panel, en «Medios amigos»). */
  tipo?: "medios";
};

export const SECCIONES: readonly Seccion[] = [
  { slug: "servicios-sociales", nombre: "Servicios Sociales", bajada: "Información y ayuda para los vecinos de San Juan." },
  { slug: "comunidad", nombre: "Comunidad", bajada: "Lo que pasa en los barrios y lo que hacen los vecinos." },
  { slug: "solidario", nombre: "Solidario", bajada: "Campañas, colectas y gestos solidarios." },
  {
    slug: "eventos",
    nombre: "Eventos",
    bajada: "Espectáculos y actividades. Incluye ferias, recitales, festivales y actividades culturales.",
    // Las notas de espectáculos también son eventos.
    tambien: ["Espectáculos"],
  },
  { slug: "carta-abierta", nombre: "Carta Abierta", bajada: "Cartas abiertas que llegan a la redacción." },
  { slug: "entrevista", nombre: "Entrevista", bajada: "Charlas con los protagonistas de la noticia." },
  {
    slug: "tapa-mi-numero",
    nombre: "Tapá mi número",
    bajada: "Denuncias y reclamos con reserva de identidad. Mensajes de la gente con reserva de identidad.",
  },
  {
    slug: "cartas-de-la-vieja-pocha",
    nombre: "Cartas de la Vieja Pocha",
    bajada: "Opiniones, comentarios, anécdotas e historias de nuestros vecinos. Espacio destinado a la participación de los lectores.",
  },
  {
    slug: "medios-amigos",
    nombre: "Medios amigos",
    bajada: "Páginas web, radios, canales y redes sociales de medios aliados.",
    tipo: "medios",
  },
];

/** ¿La nota va en esta sección? Por su categoría (o las que la sección suma). Las secciones de medios no tienen notas. */
export const notaEnSeccion = (n: { categoria: string }, s: Seccion) =>
  s.tipo !== "medios" && (n.categoria === s.nombre || (s.tambien ?? []).includes(n.categoria as Categoria));

export const seccionPorSlug = (slug: string) => SECCIONES.find((s) => s.slug === slug);
export const rutaSeccion = (s: Seccion) => `/secciones/${s.slug}`;

/**
 * Espacios fijos de la portada que se alimentan con noticias propias: cada noticia puede pertenecer a uno
 * (o a ninguno, y entonces va a las últimas noticias). Se eligen desde el formulario de la noticia.
 * Viva Feria fue un espacio y se retiró: las notas que lo tenían guardado conservan el valor "viva-feria", que ya no
 * es un espacio válido (se las ve sin etiqueta y, al editarlas, quedan sin espacio).
 */
export const ESPACIOS = ["si-san-juan"] as const;
export type Espacio = (typeof ESPACIOS)[number];

export const ESPACIO_INFO: Record<
  Espacio,
  { nombre: string; subtitulo: string; ruta: string; bajada: string; vacio: string }
> = {
  "si-san-juan": {
    nombre: "Servicios",
    subtitulo: "Información social y gubernamental",
    ruta: "/si-san-juan",
    bajada: "Anuncios e información de servicios.",
    vacio: "Cuando haya anuncios nuevos, los vas a ver acá.",
  },
};

export const esEspacio = (v: unknown): v is Espacio => (ESPACIOS as readonly unknown[]).includes(v);

export type Noticia = {
  id: string;
  slug: string;
  titulo: string;
  /** El texto plano de la nota. Si se escribió con el editor, sale de `contenido`. */
  cuerpo: string;
  /** Lo escrito con el editor: texto con formato, fotos, videos e incrustados entre los párrafos. Ver lib/contenido. */
  contenido?: Contenido;
  categoria: string;
  zona: string;
  /** Dirección de la foto en Vercel Blob, o nombre del archivo en data/uploads (servido desde /media). Ver srcImagen. */
  imagen: string | null;
  /** Video subido: dirección en Vercel Blob o nombre del archivo en data/uploads/videos (ver srcVideo). */
  video?: string;
  /** Enlaces de YouTube, Vimeo, TikTok, Facebook o Instagram que se muestran dentro de la nota. */
  incrustados?: string[];
  /** Redes donde se publicó. Define en qué columna de la portada aparece. */
  canales: Canal[];
  /** Link a la publicación original en cada red. */
  enlaces: Partial<Record<Canal, string>>;
  urgente: boolean;
  destacada: boolean;
  publicada: boolean;
  /** Si pertenece a un espacio propio de la portada (hoy, Servicios). */
  espacio?: Espacio;
  /** Contenido de muestra para borrar desde el panel. */
  ejemplo: boolean;
  creada: string;
  actualizada: string;
  /** De dónde salió: cargada a mano o importada desde una red. Las anteriores a la sincronización no lo tienen. */
  origen?: "manual" | "instagram" | "facebook";
  /** Id de la publicación original en cada red, para no importarla dos veces. */
  externos?: Partial<Record<Canal, string>>;
};

/**
 * La sección de videos (hoy "Sin censura", el nombre se cambia desde Ajustes). Antes admitía notas con color:
 * las notas viejas quedan guardadas pero ya no se muestran, porque la sección es solo de videos.
 */
export const TIPOS_SC = ["nota", "video"] as const;
export type TipoSC = (typeof TIPOS_SC)[number];

/** Un video de la sección. Va aparte de las noticias: tiene su propia página y su propio panel. */
export type PiezaSC = {
  id: string;
  slug: string;
  tipo: TipoSC;
  titulo: string;
  /** La bajada del video. Puede quedar vacía. */
  cuerpo: string;
  /** Carátula: dirección en Vercel Blob, o nombre del archivo en data/uploads. Ver srcImagen. */
  imagen: string | null;
  /** Video subido: dirección en Vercel Blob o nombre del archivo en data/uploads/videos (ver srcVideo). */
  video?: string;
  /** Enlaces de YouTube, Vimeo, TikTok, Facebook o Instagram que se muestran dentro de la pieza. */
  incrustados?: string[];
  destacada: boolean;
  publicada: boolean;
  /** Contenido de muestra para borrar desde el panel. */
  ejemplo: boolean;
  creada: string;
  actualizada: string;
};

export const SLOTS = ["banner", "banner-2", "lateral-izq", "lateral-der", "promo"] as const;
export type SlotAnuncio = (typeof SLOTS)[number];

export const SLOT_NOMBRE: Record<SlotAnuncio, string> = {
  banner: "Banner horizontal 1 (arriba, antes de las redes)",
  "banner-2": "Banner horizontal 2 (debajo del bloque Comunidad)",
  "lateral-izq": "Lateral izquierdo (ya no se muestra)",
  "lateral-der": "Banner horizontal (arriba de Secciones)",
  promo: "Promociones",
};

/** Cómo se previsualiza la foto al editarla, según el lugar donde se publica. */
export function marcoAnuncio(slot: SlotAnuncio): { aspecto: string; ajuste: "cover" | "contain"; ayuda: string } {
  if (slot === "promo") {
    return { aspecto: "aspect-[4/3]", ajuste: "cover", ayuda: "Horizontal 4:3, unos 800 por 600 px." };
  }
  if (slot === "lateral-der") {
    return { aspecto: "aspect-[5/1]", ajuste: "contain", ayuda: "Horizontal, unos 1400 por 280 px. Se ve entera, arriba de Secciones." };
  }
  if (slot === "lateral-izq") {
    return { aspecto: "aspect-[4/3]", ajuste: "contain", ayuda: "Este lugar ya no aparece en la portada." };
  }
  return { aspecto: "aspect-[97/25]", ajuste: "contain", ayuda: "Horizontal, 970 por 250 px. Se ve entera, sin recortarla." };
}

export type Anuncio = {
  id: string;
  slot: SlotAnuncio;
  titulo: string;
  imagen: string | null;
  enlace: string;
  activo: boolean;
  creada: string;
};

/** Qué clase de medio aliado es: se muestra bajo el logo cuando el enlace no lleva a una red conocida. */
export const TIPOS_MEDIO = ["Radio", "Página web", "Diario", "Canal", "Red social"] as const;
export type TipoMedio = (typeof TIPOS_MEDIO)[number];

/** Un medio aliado: aparece con su logo y su enlace en la sección «Medios amigos». Se carga desde el panel. */
export type MedioAmigo = {
  id: string;
  nombre: string;
  tipo: TipoMedio;
  /** Foto del logo (dirección en Vercel Blob o nombre del archivo, ver srcImagen). Sin logo se muestra el nombre en letras. */
  logo: string | null;
  /** A dónde lleva. Sin dirección el medio se muestra igual, pero no es un enlace. */
  enlace: string;
  activo: boolean;
  creada: string;
};

export type YoutubeModo = "auto" | "manual" | "off";

export type Ajustes = {
  lema: string;
  aviso: string;
  whatsappCanal: string;
  instagram: string;
  facebook: string;
  youtube: string;
  youtubeModo: YoutubeModo;
  youtubeVideoManual: string;
  /** Número con código de país, solo dígitos. Recibe noticias y consultas de publicidad. */
  whatsappContacto: string;
  /** Cómo se llama la sección de videos en el menú, los títulos y el pie ("Sin censura" o "Sin filtro"). */
  nombreVideos: string;
  /** La frase institucional grande que va debajo de los videos. */
  declaracion: string;
  /** Título y texto de la invitación a mandar una historia (el texto va entre comillas). */
  historiaTitulo: string;
  historiaTexto: string;
  /** Canal de YouTube de TOMATEVE: el @usuario, el ID que empieza con UC o el enlace. */
  tomateve: string;
  /** Enlace para escuchar Radio del Sur en vivo (el reproductor de la página usa la señal directa). */
  radioEnlace: string;
  /** Código de verificación de Google Search Console (solo el código, sin la etiqueta). Ver codigoGoogle en lib/seo. */
  googleVerificacion: string;
  /** Importar solo lo nuevo de Instagram y Facebook mientras haya una cuenta conectada. */
  sincronizar: boolean;
  /** Lo importado se publica directo (true) o queda como borrador para revisar (false). */
  sincronizarPublicar: boolean;
  /** Categoría que se le pone a lo importado. Se puede cambiar noticia por noticia. */
  sincronizarCategoria: string;
  sincronizarCadaMin: number;
};

/** Datos de la cuenta de Meta. Nunca salen del servidor: solo viven en la base y no están en Ajustes. */
export type ConexionMeta = {
  pageId: string;
  pageNombre: string;
  pageToken: string;
  igId: string | null;
  igUsuario: string | null;
  conectadaEn: string;
};

export type ResultadoRed = { nuevas: number; fusionadas: number; error?: string };

export type EstadoSync = {
  ultima: string | null;
  instagram?: ResultadoRed;
  facebook?: ResultadoRed;
  /** El token dejó de servir y hay que volver a conectar. */
  reconectar?: boolean;
};

/** Enlace de feed (RSS o JSON) que el sitio lee solo. La URL puede ser privada: no sale del servidor. */
export type FeedExterno = {
  id: string;
  nombre: string;
  url: string;
  /** Red por defecto si el feed no deja ver de cuál es cada publicación. */
  red: "instagram" | "facebook";
  creada: string;
  ultima: string | null;
  nuevas: number;
  fusionadas: number;
  error?: string;
};

export type EventoWebhook = {
  en: string;
  red: string | null;
  estado: "nueva" | "unida" | "repetida" | "error";
  detalle?: string;
};

/** Aviso entrante para Make, Zapier y similares. De la clave solo se guarda su huella. */
export type WebhookMeta = {
  claveHash: string | null;
  creada: string | null;
  recibidos: number;
  eventos: EventoWebhook[];
};

export type MetaDb = {
  conexion: ConexionMeta | null;
  estado: EstadoSync;
  feeds: FeedExterno[];
  webhook: WebhookMeta;
};

export type Db = {
  noticias: Noticia[];
  sinCensura: PiezaSC[];
  anuncios: Anuncio[];
  /** Los medios aliados, en el orden en que se muestran. */
  mediosAmigos: MedioAmigo[];
  ajustes: Ajustes;
  meta: MetaDb;
};

export type LiveStatus = {
  live: boolean;
  videoId: string | null;
  titulo: string | null;
  canalId: string | null;
  motivo: "en-vivo" | "sin-transmision" | "sin-canal" | "apagado" | "manual" | "error";
};
