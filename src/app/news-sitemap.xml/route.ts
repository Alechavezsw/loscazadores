import { connection } from "next/server";
import { srcImagenAbsoluto } from "@/lib/imagen-url";
import { getNoticias } from "@/lib/queries";
import { NOMBRE_SITIO } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { respuestaXml, xml } from "@/lib/xml";

/** Google Noticias solo toma del mapa las notas de los últimos dos días, y hasta mil. */
const DOS_DIAS = 2 * 24 * 60 * 60 * 1000;
const MAXIMO = 1000;

/**
 * Mapa de noticias para Google Noticias (/news-sitemap.xml). Se carga en Search Console junto con /sitemap.xml.
 * Lleva solo lo publicado en las últimas 48 horas: si en ese tiempo no hubo notas, sale vacío y es correcto.
 */
export async function GET() {
  // La lista depende de la hora del pedido, así que se arma en cada pedido (las notas vienen de la caché).
  await connection();
  const sitio = urlSitio();
  const desde = Date.now() - DOS_DIAS;
  const recientes = (await getNoticias()).filter((n) => Date.parse(n.creada) >= desde).slice(0, MAXIMO);

  const urls = recientes
    .map((n) => {
      const foto = n.imagen ? `\n    <image:image><image:loc>${xml(srcImagenAbsoluto(n.imagen, sitio))}</image:loc></image:image>` : "";
      return `  <url>
    <loc>${xml(`${sitio}/noticias/${n.slug}`)}</loc>
    <lastmod>${xml(n.actualizada)}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${xml(NOMBRE_SITIO)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${xml(n.creada)}</news:publication_date>
      <news:title>${xml(n.titulo)}</news:title>
    </news:news>${foto}
  </url>`;
    })
    .join("\n");

  return respuestaXml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`);
}
