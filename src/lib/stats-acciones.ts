/**
 * Las acciones que se cuentan además de las visitas. Cada una tiene un nombre fijo: el sitio solo anota las
 * de esta lista (así nadie puede llenar la base de nombres inventados) y el panel usa estas etiquetas.
 */
export const ACCIONES = {
  "enviar-noticia": "Tocaron «Enviá tu noticia» (WhatsApp)",
  "sin-censura-contar": "Tocaron «Enviá tu historia» (videos, versión anterior)",
  "anunciar": "Consultaron por publicidad",
  "canal-whatsapp": "Fueron al canal de WhatsApp",
  "canal-instagram": "Fueron a Instagram",
  "canal-facebook": "Fueron a Facebook",
  "canal-youtube": "Fueron a YouTube",
  "compartir-whatsapp": "Compartieron por WhatsApp",
  "compartir-facebook": "Compartieron por Facebook",
  "compartir-enlace": "Copiaron el enlace de una nota",
  "radio-auto": "Radio del Sur: arrancó sola",
  "radio-manual": "Radio del Sur: la pusieron ellos",
} as const;

export type NombreAccion = keyof typeof ACCIONES;

/** Eventos de publicidad: llevan además el id del anuncio. */
export const EVENTOS_ANUNCIO = ["anuncio-vista", "anuncio-clic"] as const;

export const esAccion = (n: string): n is NombreAccion => Object.prototype.hasOwnProperty.call(ACCIONES, n);
