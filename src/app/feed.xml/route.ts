import { resumen } from "@/lib/format";
import { srcImagenAbsoluto } from "@/lib/imagen-url";
import { getAjustes, getNoticias } from "@/lib/queries";
import { NOMBRE_SITIO, RUTA_RSS } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { respuestaXml, xml } from "@/lib/xml";

const CANTIDAD = 40;

/** El tipo de la foto según la extensión; las que sube el panel son WebP. */
function tipoFoto(url: string) {
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
}

/**
 * Las últimas noticias en RSS (/feed.xml). Sirve para los lectores de noticias, para cargarlo en Google Search
 * Console como un mapa más y para darse de alta en el Centro de editores de Google Noticias.
 */
export async function GET() {
  const sitio = urlSitio();
  const [noticias, { lema }] = await Promise.all([getNoticias(), getAjustes()]);
  const ultimas = noticias.slice(0, CANTIDAD);
  const ultimoCambio = ultimas.reduce((max, n) => (n.actualizada > max ? n.actualizada : max), ultimas[0]?.actualizada ?? "");

  const items = ultimas
    .map((n) => {
      const url = `${sitio}/noticias/${n.slug}`;
      const foto = n.imagen ? srcImagenAbsoluto(n.imagen, sitio) : null;
      return `    <item>
      <title>${xml(n.titulo)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${new Date(n.creada).toUTCString()}</pubDate>
      <category>${xml(n.categoria)}</category>
      <dc:creator>${xml(NOMBRE_SITIO)}</dc:creator>
      <description>${xml(resumen(n.cuerpo, 300) || n.titulo)}</description>${
        foto ? `\n      <enclosure url="${xml(foto)}" type="${tipoFoto(foto)}" length="0" />\n      <media:content url="${xml(foto)}" medium="image" />` : ""
      }
    </item>`;
    })
    .join("\n");

  return respuestaXml(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xml(NOMBRE_SITIO)}</title>
    <link>${xml(sitio)}</link>
    <description>${xml(`${lema}. Diario digital de San Juan.`)}</description>
    <language>es-AR</language>${ultimoCambio ? `\n    <lastBuildDate>${new Date(ultimoCambio).toUTCString()}</lastBuildDate>` : ""}
    <atom:link href="${xml(`${sitio}${RUTA_RSS}`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${xml(`${sitio}/brand/icono-192.png`)}</url>
      <title>${xml(NOMBRE_SITIO)}</title>
      <link>${xml(sitio)}</link>
    </image>
${items}
  </channel>
</rss>
`,
    "application/rss+xml",
  );
}
