export const RANGOS = [
  { id: "hoy", dias: 1, etiqueta: "Hoy", previo: "ayer" },
  { id: "7", dias: 7, etiqueta: "7 días", previo: "los 7 días anteriores" },
  { id: "30", dias: 30, etiqueta: "30 días", previo: "los 30 días anteriores" },
  { id: "90", dias: 90, etiqueta: "90 días", previo: "los 90 días anteriores" },
] as const;

export type Rango = (typeof RANGOS)[number];

export const RANGO_POR_DEFECTO: Rango = RANGOS[1];

export const rangoDe = (id: string | string[] | undefined): Rango => RANGOS.find((r) => r.id === id) ?? RANGO_POR_DEFECTO;
