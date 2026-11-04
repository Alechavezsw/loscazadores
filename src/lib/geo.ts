/** Nombres de lugares para las estadísticas. Sin dependencias: sirve en el servidor y en pruebas. */

/** Provincias argentinas según su código ISO 3166-2 (lo que informa la red de Vercel). */
export const PROVINCIAS_AR: Record<string, string> = {
  A: "Salta",
  B: "Buenos Aires",
  C: "Ciudad de Buenos Aires",
  D: "San Luis",
  E: "Entre Ríos",
  F: "La Rioja",
  G: "Santiago del Estero",
  H: "Chaco",
  J: "San Juan",
  K: "Catamarca",
  L: "La Pampa",
  M: "Mendoza",
  N: "Misiones",
  P: "Formosa",
  Q: "Neuquén",
  R: "Río Negro",
  S: "Santa Fe",
  T: "Tucumán",
  U: "Chubut",
  V: "Tierra del Fuego",
  W: "Corrientes",
  X: "Córdoba",
  Y: "Jujuy",
  Z: "Santa Cruz",
};

export const SIN_DATO = "Sin dato";

export function nombrePais(codigo: string): string {
  if (!codigo || codigo === "??") return SIN_DATO;
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

/** `clave` viene como "AR-J". */
export function nombreProvincia(clave: string): string {
  const region = clave.split("-")[1] ?? "";
  return PROVINCIAS_AR[region] ?? (region || SIN_DATO);
}
