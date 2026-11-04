/** Cómo se escriben los números y las fechas en el panel de estadísticas. Sin dependencias. */

const entero = new Intl.NumberFormat("es-AR");

export const numero = (n: number) => entero.format(Math.round(n));

/** 950 → "950", 1.234 → "1,2 K", 12.500 → "12,5 K". Para los ejes y los números chicos. */
export function compacto(n: number): string {
  const a = Math.abs(n);
  if (a < 1000) return String(Math.round(n));
  const v = n / 1000;
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: a < 10_000 ? 1 : 0 }).format(v)} K`;
}

/** 0,1234 → "12 %" */
export const porcentaje = (frac: number, decimales = 0) =>
  `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: decimales, minimumFractionDigits: decimales }).format(frac * 100)} %`;

/** 92 → "1 min 32 s", 45 → "45 s", 0 → "—" */
export function duracion(seg: number): string {
  if (!(seg >= 1)) return "—";
  const s = Math.round(seg);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} min` : `${m} min ${r} s`;
}

const corta = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const larga = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const aFecha = (dia: string) => {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};

/** "2026-10-27" → "27 oct" */
export const fechaCorta = (dia: string) => corta.format(aFecha(dia)).replace(".", "");
/** "2026-10-27" → "martes 27 de octubre" */
export const fechaLarga = (dia: string) => larga.format(aFecha(dia));

/** Para el tope de un eje: el siguiente número "redondo" (1, 2, 2,5, 5 × 10ⁿ) y la separación entre marcas. */
export function escalaNice(max: number, marcas = 4): { tope: number; paso: number } {
  if (max <= 0) return { tope: marcas, paso: 1 };
  const bruto = max / marcas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / potencia;
  const bonito = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  const paso = Math.max(1, bonito * potencia);
  return { tope: paso * marcas, paso };
}
