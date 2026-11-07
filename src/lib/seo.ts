import type { Metadata } from "next";
import { srcImagen } from "./imagen-url";

const SITIO = "Los Cazadores de Noticias";
const OG = "/brand/og.png";

type Opciones = {
  titulo: string;
  descripcion: string;
  /** Ruta del sitio, con barra inicial. Es el enlace canónico y el og:url. */
  ruta: string;
  /** Foto de la nota o del video. Si no hay, se usa la tarjeta de la marca. */
  imagen?: string | null;
  tipo?: "website" | "article" | "video.other";
  publicado?: string;
  actualizado?: string;
  seccion?: string;
  /** Título de la pestaña cuando no debe sumarse el nombre del medio. */
  tituloAbsoluto?: string;
};

/** Metadatos de una página pública: título, descripción, canónico, Open Graph y tarjeta de X. */
export function metaPagina(o: Opciones): Metadata {
  const foto = o.imagen ? srcImagen(o.imagen) : OG;
  const images = o.imagen
    ? [{ url: foto, alt: o.titulo }]
    : [{ url: OG, width: 1200, height: 630, alt: SITIO }];
  const comun = {
    url: o.ruta,
    title: o.titulo,
    description: o.descripcion,
    locale: "es_AR",
    siteName: SITIO,
    images,
  };

  return {
    title: o.tituloAbsoluto ? { absolute: o.tituloAbsoluto } : o.titulo,
    description: o.descripcion,
    alternates: { canonical: o.ruta },
    robots: { index: true, follow: true },
    openGraph:
      o.tipo === "article"
        ? {
            ...comun,
            type: "article",
            publishedTime: o.publicado,
            modifiedTime: o.actualizado ?? o.publicado,
            section: o.seccion,
          }
        : o.tipo === "video.other"
          ? { ...comun, type: "video.other" }
          : { ...comun, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: o.titulo,
      description: o.descripcion,
      images: [foto],
    },
  };
}
