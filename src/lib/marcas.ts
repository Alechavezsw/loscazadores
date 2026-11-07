/**
 * Marcas que la portada muestra con su logo: el canal de YouTube y los programas de TomateTV y de
 * Radio del Sur. Cuando llega un logo se guarda en public/brand/ y se escribe acá su ruta (por ejemplo
 * "/brand/tomate-tv.png"). Mientras `logo` sea null, la portada muestra el nombre en texto.
 */
export type Marca = {
  nombre: string;
  logo: string | null;
  /** Usa el logo propio del sitio (el de Los Cazadores) en lugar de un archivo. */
  sitio?: boolean;
  /** De qué color es el casillero donde se muestra el logo. Un logo blanco necesita fondo rojo. Por defecto, claro. */
  fondo?: "claro" | "rojo";
  /**
   * De un programa: quién lo conduce (si se sabe) y por dónde sale. El horario y el aviso «Próximamente» salen de
   * la programación (lib/programas.ts).
   */
  detalle?: {
    conduce?: "Conduce" | "Conducen";
    conduccion?: string;
    emision: string;
  };
};

const EMISION_TDA = "TomateTV Streaming y la Televisión Digital Abierta, canal 35.2, señal La Retro";

export const MARCAS = {
  tomateve: { nombre: "TomateTV", logo: "/brand/tomate-tv.png" },
  rockola: {
    nombre: "La Rockola de Beethoven",
    logo: "/brand/rockola-beethoven.png",
    detalle: {
      conduce: "Conducen",
      conduccion: "Carlos Tuti García y Sergio Kuka Guardia",
      emision: EMISION_TDA,
    },
  },
  madres: {
    nombre: "Madres en Corto",
    logo: "/brand/madres-en-corto.png",
    detalle: { conduce: "Conduce", conduccion: "Marianella Zeballos", emision: "TomateTV Streaming" },
  },
  cazadores: { nombre: "Los Cazadores de Noticias", logo: null, sitio: true, detalle: { emision: EMISION_TDA } },
  radio: { nombre: "Radio del Sur", logo: null },
  // Este logo es blanco (con transparencia): va directo sobre el rojo de la tarjeta de la radio, no sobre un casillero blanco.
  bailongo: { nombre: "Se Armó el Bailongo", logo: "/brand/se-armo-el-bailongo.png", fondo: "rojo" },
} satisfies Record<string, Marca>;

/** Un medio aliado: aparece con su logo y su enlace en la sección «Medios amigos». */
export type MedioAmigo = {
  nombre: string;
  /** Qué clase de medio es: se muestra bajo el logo. */
  tipo: "Radio" | "Página web" | "Canal" | "Red social";
  /** Ruta del logo en public/brand/. Sin logo se muestra el nombre en letras. */
  logo: string | null;
  /** A dónde lleva. Sin dirección el medio se muestra igual, pero no es un enlace. */
  enlace?: string;
  /** Usa el enlace de la radio que se carga en Ajustes, para no escribirlo en dos lugares. */
  enlaceDeLaRadio?: boolean;
};

/** Los medios aliados, en el orden en que se muestran. Se suma uno nuevo acá, con su logo y su enlace. */
export const MEDIOS_AMIGOS: readonly MedioAmigo[] = [
  { nombre: "Radio del Sur", tipo: "Radio", logo: MARCAS.radio.logo, enlace: "https://www.instagram.com/radio_delsur/" },
];

/** Los programas que recorre el carrusel del final de la portada. Se suma uno nuevo acá, apenas tenga logo. */
export const CARRUSEL_PROGRAMAS: readonly Marca[] = [MARCAS.rockola, MARCAS.madres, MARCAS.bailongo, MARCAS.cazadores];

/** Los programas que salen por TomateTV, en el orden en que se muestran. */
export const PROGRAMAS_TOMATE: readonly Marca[] = [MARCAS.rockola, MARCAS.madres, MARCAS.cazadores];
