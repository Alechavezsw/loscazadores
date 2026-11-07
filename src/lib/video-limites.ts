/**
 * Datos de los videos que comparten el servidor y el panel (sin nada que solo corra en el servidor).
 *
 * Dónde se guarda un video subido, según el entorno:
 *  - "bd": en la base Postgres, por trozos. Es lo que se usa apenas hay DATABASE_URL, y sirve en Vercel.
 *  - "blob": en Vercel Blob (si no hay base pero sí BLOB_READ_WRITE_TOKEN).
 *  - "local": en el disco de la computadora o del servidor propio.
 */
export type ModoVideo = "bd" | "blob" | "local";

/** Una función de Vercel no recibe pedidos de más de 4,5 MB: el panel sube a la base de a trozos más chicos que eso. */
export const TROZO_VIDEO_BYTES = 3 * 1024 * 1024;

/** Tope de un video guardado en la base: cada MB cuenta contra el espacio de la base de datos. */
export const MAX_VIDEO_BD_BYTES = 100 * 1024 * 1024;

/** Tope en Blob o en disco. */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"] as const;
