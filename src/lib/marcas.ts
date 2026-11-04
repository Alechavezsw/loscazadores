/**
 * Marcas que la portada muestra con su logo: el canal de YouTube y los programas de Toma TV y de
 * Radio del Sur. Cuando llega un logo se guarda en public/brand/ y se escribe acá su ruta (por ejemplo
 * "/brand/tomate-tv.png"). Mientras `logo` sea null, la portada muestra el nombre en texto.
 */
export type Marca = {
  nombre: string;
  logo: string | null;
  /** Usa el logo propio del sitio (el de Los Cazadores) en lugar de un archivo. */
  sitio?: boolean;
};

export const MARCAS = {
  tomateve: { nombre: "Toma TV", logo: null },
  rockola: { nombre: "La Rockola de Beethoven", logo: null },
  madres: { nombre: "Madres en Corto", logo: null },
  cazadores: { nombre: "Los Cazadores de Noticias", logo: null, sitio: true },
  radio: { nombre: "Radio del Sur", logo: null },
  bailongo: { nombre: "Se Armó el Bailongo", logo: null },
} satisfies Record<string, Marca>;

/** Los programas que salen por Toma TV, en el orden en que se muestran. */
export const PROGRAMAS_TOMATE: readonly Marca[] = [MARCAS.rockola, MARCAS.madres, MARCAS.cazadores];
