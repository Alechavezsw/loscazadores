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
  "Comunidad",
  "Eventos",
  "Espectáculos",
] as const;

/**
 * Espacios fijos de la portada que se alimentan con noticias propias: cada noticia puede pertenecer a uno
 * (o a ninguno, y entonces va a las últimas noticias). Se eligen desde el formulario de la noticia.
 */
export const ESPACIOS = ["viva-feria", "si-san-juan"] as const;
export type Espacio = (typeof ESPACIOS)[number];

export const ESPACIO_INFO: Record<
  Espacio,
  { nombre: string; subtitulo: string; ruta: string; bajada: string; vacio: string }
> = {
  "viva-feria": {
    nombre: "Viva Feria",
    subtitulo: "Espacio de Emprendedores",
    ruta: "/viva-feria",
    bajada: "Todas las novedades de cada edición de Viva Feria, el espacio de los emprendedores sanjuaninos.",
    vacio: "Cuando haya novedades de la próxima edición, las vas a ver acá.",
  },
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
  cuerpo: string;
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
  /** Si pertenece a un espacio propio de la portada (Viva Feria, Servicios). */
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

export const SLOTS = ["lateral-izq", "lateral-der", "promo"] as const;
export type SlotAnuncio = (typeof SLOTS)[number];

export const SLOT_NOMBRE: Record<SlotAnuncio, string> = {
  "lateral-izq": "Lateral izquierdo",
  "lateral-der": "Lateral derecho",
  promo: "Promociones",
};

export type Anuncio = {
  id: string;
  slot: SlotAnuncio;
  titulo: string;
  imagen: string | null;
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
