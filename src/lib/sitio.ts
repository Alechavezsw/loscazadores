/**
 * Dirección pública del sitio, sin barra al final. Sirve para los enlaces completos (redes sociales, mapa
 * del sitio, la dirección de los avisos de Make). Se toma, en este orden, de NEXT_PUBLIC_SITE_URL (el dominio
 * propio), del dominio de producción que Vercel le asigna al proyecto, o de localhost.
 */
export function urlSitio() {
  const propia = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = propia || (vercel ? `https://${vercel}` : "http://localhost:3030");
  return url.replace(/\/$/, "");
}
