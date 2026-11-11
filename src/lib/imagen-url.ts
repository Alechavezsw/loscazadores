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

/** Igual que srcVideo, pero con el dominio completo, para etiquetas de redes y datos estructurados. */
export function srcVideoAbsoluto(valor: string, sitio: string) {
  const src = srcVideo(valor);
  return src.startsWith("/") ? `${sitio}${src}` : src;
}

/**
 * La tarjeta que se arma sola para compartir un video sin carátula (ver app/og/video/[slug]). Lleva la fecha de
 * la última edición para que, si cambia el título, las redes pidan la tarjeta nueva.
 */
export function tarjetaVideo(p: { slug: string; actualizada: string }) {
  return `/og/video/${p.slug}?v=${Date.parse(p.actualizada) || 0}`;
}

/** El tipo de archivo de un video subido, según su extensión. */
export function tipoVideo(valor: string) {
  const ext = valor.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : ext === "ogv" ? "video/ogg" : "video/mp4";
}

/** Igual que srcImagen, para videos: dirección completa en Vercel Blob o archivo local (se sirve desde /media/video). */
export function srcVideo(valor: string) {
  return valor.startsWith("https://") || valor.startsWith("http://") ? valor : `/media/video/${valor}`;
}
