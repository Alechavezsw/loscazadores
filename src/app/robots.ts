import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

const sitio = urlSitio();

/**
 * Qué pueden recorrer los buscadores. El panel no se nombra acá a propósito: este archivo es público y delataría su
 * dirección; ya lleva la etiqueta «noindex» en todas sus páginas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: [`${sitio}/sitemap.xml`, `${sitio}/news-sitemap.xml`],
  };
}
