import { FacebookLogo, InstagramLogo, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { MARCAS } from "@/lib/marcas";
import type { Canal } from "@/lib/types";

export const CANAL_UI: Record<
  Canal,
  {
    nombre: string;
    corto: string;
    Icono: typeof WhatsappLogo;
    /** Logo propio de la columna; si no hay, se usa el ícono de la red. */
    logo?: string | null;
    /** Color de la cabecera. Instagram lleva degradado propio y no usa la trama de puntos. */
    barra: string;
    /** Color del ícono cuando va sobre el círculo blanco. */
    tinta: string;
    boton: string;
    cta: string;
  }
> = {
  whatsapp: {
    nombre: "Canal de WhatsApp",
    corto: "WhatsApp",
    Icono: WhatsappLogo,
    barra: "trama bg-wa",
    tinta: "text-wa",
    boton: "bg-ink hover:bg-wa",
    cta: "Ver en WhatsApp",
  },
  instagram: {
    nombre: "Instagram",
    corto: "Instagram",
    Icono: InstagramLogo,
    barra: "bg-[linear-gradient(115deg,#f9ce34_0%,#ee2a7b_42%,#8134af_78%,#515bd4_100%)]",
    tinta: "text-ig",
    boton: "bg-ink hover:bg-ig",
    cta: "Ver en Instagram",
  },
  facebook: {
    nombre: "Facebook",
    corto: "Facebook",
    Icono: FacebookLogo,
    barra: "trama bg-fb",
    tinta: "text-fb",
    boton: "bg-ink hover:bg-fb",
    cta: "Ver en Facebook",
  },
  // El canal de YouTube es el de Tomateteve, por donde salen los programas.
  youtube: {
    nombre: MARCAS.tomateve.nombre,
    corto: "YouTube",
    Icono: YoutubeLogo,
    logo: MARCAS.tomateve.logo,
    barra: "trama bg-hunter",
    tinta: "text-hunter",
    boton: "bg-ink hover:bg-hunter",
    cta: "Ver Tomateteve Streaming",
  },
};
