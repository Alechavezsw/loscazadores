import { RADIO } from "./radio";

/**
 * La programación que el sitio acompaña en la portada. Los horarios son de San Juan sin importar dónde esté
 * quien visita. Sirve en el navegador y en el servidor.
 */

export const TOMATEVE = {
  nombre: "Tomateteve Streaming",
  zona: "America/Argentina/San_Juan",
} as const;

export type Emision = {
  /** Tiene que coincidir con el nombre de la marca en lib/marcas.ts. */
  programa: string;
  /** 0 = domingo … 6 = sábado. */
  dia: number;
  desde: number;
  /** 24 = la medianoche. */
  hasta: number;
  /**
   * Todavía no sale al aire: se muestra su horario con el aviso «Próximamente», pero no cuenta para la «próxima
   * transmisión» ni para la frase de la programación. Al empezar, se borra esta línea.
   */
  proximamente?: boolean;
};

/** Lo que sale por TomateTV cada semana, por día y horario. */
export const PROGRAMACION: readonly Emision[] = [
  { programa: "Madres en Corto", dia: 1, desde: 20, hasta: 22 },
  { programa: "La Rockola de Beethoven", dia: 1, desde: 22, hasta: 24 },
  { programa: "Los Cazadores de Noticias", dia: 4, desde: 22, hasta: 24, proximamente: true },
];

/** Lo que ya está saliendo al aire. */
const AL_AIRE = PROGRAMACION.filter((e) => !e.proximamente);

/** ¿El programa todavía no empezó a emitirse? */
export const esProximamente = (programa: string) => PROGRAMACION.some((e) => e.programa === programa && e.proximamente);

export const BAILONGO = {
  nombre: "Se Armó el Bailongo",
  texto: "Escuchá Se Armó el Bailongo todos los sábados por Radio del Sur 101.1 FM, de 18:00 a 21:00.",
  horario: `Sábados de ${RADIO.desde}:00 a ${RADIO.hasta}:00 hs`,
} as const;

const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const plural = (dia: string) => (dia.endsWith("s") ? dia : `${dia}s`);
/** La hora como se escribe en pantalla: 20 → «20:00», 24 → «00:00». */
const hora = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

/** «Lunes de 20:00 a 22:00 hs», o null si el programa no figura en la programación. */
export function horarioDe(programa: string): string | null {
  const e = PROGRAMACION.find((p) => p.programa === programa);
  return e ? `${mayuscula(NOMBRE_DIA[e.dia])} de ${hora(e.desde)} a ${hora(e.hasta)} hs` : null;
}

/** Toda la programación en una frase: «los lunes: Madres en Corto de 20:00 a 22:00 hs y La Rockola de…». */
export const PROGRAMACION_FRASE = (() => {
  const porDia = new Map<number, Emision[]>();
  for (const e of AL_AIRE) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e]);
  return [...porDia]
    .map(
      ([d, es]) =>
        `los ${plural(NOMBRE_DIA[d])}: ${es.map((e) => `${e.programa} de ${hora(e.desde)} a ${hora(e.hasta)} hs`).join(" y ")}`,
    )
    .join("; ");
})();

/** Lo que se muestra en el servidor (y antes de saber la hora de quien visita): la primera emisión de la semana. */
export const PRIMERA_EMISION = {
  programa: AL_AIRE[0].programa,
  cuando: `${mayuscula(NOMBRE_DIA[AL_AIRE[0].dia])} a las ${AL_AIRE[0].desde}:00 hs`,
} as const;

const reloj = new Intl.DateTimeFormat("en-US", {
  timeZone: TOMATEVE.zona,
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});

function ahoraEnSanJuan(ahora: Date) {
  const p = Object.fromEntries(reloj.formatToParts(ahora).map((x) => [x.type, x.value]));
  return { dia: DIAS[p.weekday], hora: Number(p.hour) };
}

/** ¿Estamos dentro del horario de algún programa de TomateTV? */
export function enHorarioTomateve(ahora: Date) {
  const { dia, hora: h } = ahoraEnSanJuan(ahora);
  return AL_AIRE.some((e) => e.dia === dia && h >= e.desde && h < e.hasta);
}

/** La próxima emisión que todavía no empezó: qué programa es y cuándo sale («Hoy a las 20:00 hs»). */
function siguiente(ahora: Date) {
  const { dia, hora: h } = ahoraEnSanJuan(ahora);
  for (let sumar = 0; sumar <= 7; sumar++) {
    const d = (dia + sumar) % 7;
    const e = AL_AIRE.filter((p) => p.dia === d)
      .sort((a, b) => a.desde - b.desde)
      .find((p) => sumar > 0 || h < p.desde);
    if (!e) continue;
    const cuando = sumar === 0 ? "Hoy" : sumar === 1 ? "Mañana" : `El ${NOMBRE_DIA[d]}`;
    return { programa: e.programa, cuando: `${cuando} a las ${e.desde}:00 hs` };
  }
  return PRIMERA_EMISION;
}

/** "Hoy a las 20:00", "Mañana a las 22:00" o "El lunes a las 20:00 hs": la próxima vez que sale al aire algo. */
export const proximaTomateve = (ahora: Date): string => siguiente(ahora).cuando;

/** El programa que sale en la próxima emisión. */
export const programaProximo = (ahora: Date): string => siguiente(ahora).programa;
