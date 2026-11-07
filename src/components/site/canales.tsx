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
    barra: string;
    boton: string;
    cta: string;
  }
> = {
  whatsapp: {
    nombre: "Canal de WhatsApp",
    corto: "WhatsApp",
    Icono: WhatsappLogo,
    barra: "bg-hunter",
    boton: "bg-ink hover:bg-hunter",
    cta: "Ver en WhatsApp",
  },
  instagram: {
    nombre: "Instagram",
    corto: "Instagram",
    Icono: InstagramLogo,
    barra: "bg-hunter",
    boton: "bg-ink hover:bg-hunter",
    cta: "Ver en Instagram",
  },
  facebook: {
    nombre: "Facebook",
    corto: "Facebook",
    Icono: FacebookLogo,
    barra: "bg-hunter",
    boton: "bg-ink hover:bg-hunter",
    cta: "Ver en Facebook",
  },
  // El canal de YouTube es el de TomateTV, por donde salen los programas.
  youtube: {
    nombre: MARCAS.tomateve.nombre,
    corto: "YouTube",
    Icono: YoutubeLogo,
    logo: MARCAS.tomateve.logo,
    barra: "bg-hunter",
    boton: "bg-ink hover:bg-hunter",
    cta: "Ver TomateTV",
  },
};
