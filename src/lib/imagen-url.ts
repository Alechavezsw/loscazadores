/**
 * Una noticia guarda su foto de dos maneras según dónde corra el sitio: la dirección completa en Vercel Blob
 * o el nombre del archivo en el disco (que se sirve desde /media). Esto devuelve siempre algo que el
 * navegador pueda cargar.
 */
export function srcImagen(valor: string) {
  return /^https?:\/\//i.test(valor) ? valor : `/media/${valor}`;
}

/** Igual, pero con el dominio completo, para etiquetas de redes y datos estructurados. */
export function srcImagenAbsoluto(valor: string, sitio: string) {
  const src = srcImagen(valor);
  return src.startsWith("/") ? `${sitio}${src}` : src;
}

/** Igual que srcImagen, para videos: dirección completa en Vercel Blob o archivo local (se sirve desde /media/video). */
export function srcVideo(valor: string) {
  return valor.startsWith("https://") || valor.startsWith("http://") ? valor : `/media/video/${valor}`;
}
