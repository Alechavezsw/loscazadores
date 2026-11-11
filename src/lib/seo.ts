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
  /** Ruta de una tarjeta de 1200×630 armada para esta página. Se usa cuando no hay foto, en vez de la de la marca. */
  tarjeta?: string;
  /** El archivo del video, con el dominio completo, para que las redes que lo permiten lo reproduzcan en la vista previa (og:video). */
  video?: { url: string; tipo: string } | null;
  tipo?: "website" | "article" | "video.other";
  publicado?: string;
  actualizado?: string;
  seccion?: string;
  /** Título de la pestaña cuando no debe sumarse el nombre del medio. */
  tituloAbsoluto?: string;
};

/** Metadatos de una página pública: título, descripción, canónico, Open Graph y tarjeta de X. */
export function metaPagina(o: Opciones): Metadata {
  const foto = o.imagen ? srcImagen(o.imagen) : (o.tarjeta ?? OG);
  const images = o.imagen
    ? [{ url: foto, alt: o.titulo }]
    : [{ url: foto, width: 1200, height: 630, alt: o.tarjeta ? o.titulo : SITIO }];
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
          ? { ...comun, type: "video.other", videos: o.video ? [{ url: o.video.url, type: o.video.tipo }] : undefined }
          : { ...comun, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: o.titulo,
      description: o.descripcion,
      images: [foto],
    },
  };
}
