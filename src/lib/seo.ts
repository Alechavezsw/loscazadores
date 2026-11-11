import type { Metadata } from "next";
import { srcImagen } from "./imagen-url";
import type { Ajustes } from "./types";
import { limpiarUrl, perfilInstagram, perfilYoutube, soloDigitos } from "./urls";

export const NOMBRE_SITIO = "Los Cazadores de Noticias";
const SITIO = NOMBRE_SITIO;
const OG = "/brand/og.png";
/** El ícono cuadrado de la marca: es el «logo» que Google muestra junto al nombre del medio. */
export const LOGO_CUADRADO = "/brand/icono-512.png";
export const RUTA_RSS = "/feed.xml";

/**
 * Permisos para los buscadores en las páginas públicas. Además de dejarlas indexar, le dice a Google que puede
 * mostrar la foto grande (la que usa Discover), el video y todo el texto que quiera en el resultado.
 */
export const ROBOTS_ABIERTO: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

/** El lector de novedades (RSS), para que los buscadores y los lectores de noticias lo encuentren desde cualquier página. */
const TIPOS_ALTERNATIVOS = { "application/rss+xml": [{ url: RUTA_RSS, title: NOMBRE_SITIO }] };

/**
 * El código de verificación de Google Search Console. En el panel se puede pegar el código solo o la etiqueta
 * entera que da Google (`<meta name="google-site-verification" content="…" />`): de las dos formas queda el código.
 * Devuelve "" si lo pegado no es un código válido.
 */
export function codigoGoogle(valor: string | null | undefined): string {
  const v = (valor ?? "").trim();
  if (!v) return "";
  // También se acepta el texto del método por DNS («google-site-verification=…»), que trae el código después del igual.
  const codigo = v.match(/content\s*=\s*["']?([\w-]+)/i)?.[1] ?? v.replace(/^google-site-verification\s*[=:]\s*/i, "");
  return /^[\w-]{20,100}$/.test(codigo) ? codigo : "";
}

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
    alternates: { canonical: o.ruta, types: TIPOS_ALTERNATIVOS },
    robots: ROBOTS_ABIERTO,
    openGraph:
      o.tipo === "article"
        ? {
            ...comun,
            type: "article",
            publishedTime: o.publicado,
            modifiedTime: o.actualizado ?? o.publicado,
            section: o.seccion,
            authors: [SITIO],
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

// ───────────────────────── datos estructurados (JSON-LD) ─────────────────────────

/** Los perfiles del medio en las redes, para que Google los asocie al sitio. */
export function perfilesSociales(a: Pick<Ajustes, "instagram" | "facebook" | "youtube" | "tomateve" | "whatsappCanal">) {
  return [
    perfilInstagram(a.instagram),
    limpiarUrl(a.facebook),
    perfilYoutube(a.youtube) || perfilYoutube(a.tomateve),
    limpiarUrl(a.whatsappCanal),
  ].filter(Boolean);
}

/** La referencia corta al medio que llevan las notas y los videos (quién publica). */
export function ldEditor(sitio: string) {
  return {
    "@type": "NewsMediaOrganization",
    "@id": `${sitio}/#medio`,
    name: NOMBRE_SITIO,
    url: sitio,
    logo: { "@type": "ImageObject", url: `${sitio}${LOGO_CUADRADO}`, width: 512, height: 512 },
  };
}

/** La ficha completa del medio. Va una sola vez, en la portada. */
export function ldMedio(sitio: string, a: Ajustes) {
  const telefono = soloDigitos(a.whatsappContacto);
  return {
    "@context": "https://schema.org",
    ...ldEditor(sitio),
    alternateName: "Los Cazadores",
    slogan: a.lema,
    description: `${a.lema}. Diario digital de San Juan, Argentina.`,
    image: `${sitio}${OG}`,
    areaServed: { "@type": "AdministrativeArea", name: "San Juan, Argentina" },
    address: { "@type": "PostalAddress", addressRegion: "San Juan", addressCountry: "AR" },
    sameAs: perfilesSociales(a),
    ...(telefono
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Redacción y publicidad",
            telephone: `+${telefono}`,
            areaServed: "AR",
            availableLanguage: "es",
          },
        }
      : {}),
  };
}

/** El sitio en sí: de acá Google toma el nombre que muestra arriba de cada resultado. */
export function ldSitio(sitio: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${sitio}/#sitio`,
    name: NOMBRE_SITIO,
    alternateName: ["Los Cazadores", "Cazadores de Noticias"],
    url: sitio,
    inLanguage: "es-AR",
    publisher: { "@id": `${sitio}/#medio` },
  };
}

/** El camino hasta la página («Inicio › Noticias › título»). El inicio se agrega solo. */
export function ldMigas(sitio: string, pasos: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ nombre: "Inicio", ruta: "/" }, ...pasos].map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nombre,
      item: `${sitio}${p.ruta === "/" ? "" : p.ruta}`,
    })),
  };
}

/** Una página que lista notas o videos (una sección, el archivo de noticias), con sus primeros enlaces. */
export function ldListado(sitio: string, o: { nombre: string; descripcion: string; ruta: string; items: { nombre: string; ruta: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: o.nombre,
    description: o.descripcion,
    url: `${sitio}${o.ruta}`,
    inLanguage: "es-AR",
    isPartOf: { "@id": `${sitio}/#sitio` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: o.items.slice(0, 20).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.nombre,
        url: `${sitio}${it.ruta}`,
      })),
    },
  };
}
