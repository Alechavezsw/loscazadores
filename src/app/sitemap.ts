import type { MetadataRoute } from "next";
import { resumen } from "@/lib/format";
import { srcImagenAbsoluto, srcVideoAbsoluto, tarjetaVideo } from "@/lib/imagen-url";
import { getNoticias, getVideos } from "@/lib/queries";
import { ESPACIOS, ESPACIO_INFO, notaEnSeccion, rutaSeccion, SECCIONES } from "@/lib/types";
import { urlSitio } from "@/lib/sitio";
import { xml } from "@/lib/xml";

const sitio = urlSitio();

/** La fecha más nueva de una lista de notas o videos: es la última vez que cambió la página que los muestra. */
function ultima(items: { actualizada: string }[]) {
  return items.reduce<string | undefined>((max, x) => (!max || x.actualizada > max ? x.actualizada : max), undefined);
}

/**
 * El mapa del sitio que se carga en Google Search Console (/sitemap.xml). Además de las direcciones lleva la foto
 * de cada nota y los datos de cada video subido, para que salgan en Google Imágenes y en la pestaña Videos.
 * Next no escapa los textos del mapa: por eso los títulos y las direcciones pasan por xml().
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [noticias, piezas] = await Promise.all([getNoticias(), getVideos()]);
  const ultimaNota = ultima(noticias);
  const ultimoVideo = ultima(piezas);
  const ultimoCambio = ultima([...noticias, ...piezas]);

  return [
    { url: sitio, lastModified: ultimoCambio, changeFrequency: "hourly", priority: 1 },
    { url: `${sitio}/noticias`, lastModified: ultimaNota, changeFrequency: "hourly", priority: 0.8 },
    { url: `${sitio}/sin-censura`, lastModified: ultimoVideo, changeFrequency: "daily", priority: 0.7 },
    { url: `${sitio}/en-vivo`, changeFrequency: "daily", priority: 0.6 },
    ...ESPACIOS.map((e) => ({
      url: `${sitio}${ESPACIO_INFO[e].ruta}`,
      lastModified: ultima(noticias.filter((n) => n.espacio === e)),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...SECCIONES.map((s) => ({
      url: `${sitio}${rutaSeccion(s)}`,
      lastModified: ultima(noticias.filter((n) => notaEnSeccion(n, s))),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...noticias.map((n) => {
      const foto = n.imagen ? xml(srcImagenAbsoluto(n.imagen, sitio)) : null;
      return {
        url: `${sitio}/noticias/${n.slug}`,
        lastModified: n.actualizada,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...(foto ? { images: [foto] } : {}),
        // Un video necesita una imagen de muestra: sin foto, la nota va sin los datos del video.
        ...(n.video && foto
          ? {
              videos: [
                {
                  title: xml(n.titulo),
                  thumbnail_loc: foto,
                  description: xml(resumen(n.cuerpo, 300) || n.titulo),
                  content_loc: xml(srcVideoAbsoluto(n.video, sitio)),
                  publication_date: n.creada,
                },
              ],
            }
          : {}),
      };
    }),
    ...piezas.map((p) => {
      const caratula = xml(p.imagen ? srcImagenAbsoluto(p.imagen, sitio) : `${sitio}${tarjetaVideo(p)}`);
      return {
        url: `${sitio}/sin-censura/${p.slug}`,
        lastModified: p.actualizada,
        changeFrequency: "weekly" as const,
        priority: 0.6,
        ...(p.imagen ? { images: [caratula] } : {}),
        ...(p.video
          ? {
              videos: [
                {
                  title: xml(p.titulo),
                  thumbnail_loc: caratula,
                  description: xml(resumen(p.cuerpo || p.titulo, 300)),
                  content_loc: xml(srcVideoAbsoluto(p.video, sitio)),
                  publication_date: p.creada,
                },
              ],
            }
          : {}),
      };
    }),
    { url: `${sitio}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${sitio}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
