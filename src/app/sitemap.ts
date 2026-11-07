import type { MetadataRoute } from "next";
import { getNoticias, getVideos } from "@/lib/queries";
import { ESPACIOS, ESPACIO_INFO, rutaSeccion, SECCIONES } from "@/lib/types";
import { urlSitio } from "@/lib/sitio";

const sitio = urlSitio();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [noticias, piezas] = await Promise.all([getNoticias(), getVideos()]);
  return [
    { url: sitio, changeFrequency: "hourly", priority: 1 },
    { url: `${sitio}/noticias`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${sitio}/en-vivo`, changeFrequency: "daily", priority: 0.6 },
    { url: `${sitio}/videos`, changeFrequency: "daily", priority: 0.7 },
    ...ESPACIOS.map((e) => ({ url: `${sitio}${ESPACIO_INFO[e].ruta}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...SECCIONES.map((s) => ({ url: `${sitio}${rutaSeccion(s)}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...piezas.map((p) => ({
      url: `${sitio}/videos/${p.slug}`,
      lastModified: p.actualizada,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...noticias.map((n) => ({
      url: `${sitio}/noticias/${n.slug}`,
      lastModified: n.actualizada,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
