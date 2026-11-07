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
  bailongo: { nombre: "Se Armó el Bailongo", logo: "/brand/se-armo-el-bailongo.png" },
} satisfies Record<string, Marca>;

/** Los programas que salen por TomateTV, en el orden en que se muestran. */
export const PROGRAMAS_TOMATE: readonly Marca[] = [MARCAS.rockola, MARCAS.madres, MARCAS.cazadores];
