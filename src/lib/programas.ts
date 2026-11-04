import { RADIO } from "./radio";

/**
 * Los dos programas que el sitio acompaña en la portada. Los horarios son de San Juan sin importar dónde esté
 * quien visita. Sirve en el navegador y en el servidor.
 */

export const TOMATEVE = {
  nombre: "Toma TV",
  programa: "La Rockola de Beethoven",
  zona: "America/Argentina/San_Juan",
  /** 0 = domingo … 6 = sábado. Lunes y jueves. */
  dias: [1, 4],
  desde: 22,
  /** La transmisión termina a la medianoche. */
  hasta: 24,
  horario: "Lunes y jueves de 22:00 a 00:00 hs",
} as const;

export const BAILONGO = {
  nombre: "Se Armó el Bailongo",
  texto: "Escuchá Se Armó el Bailongo todos los sábados por Radio del Sur 101.1 FM, de 18:00 a 21:00.",
  horario: `Sábados de ${RADIO.desde}:00 a ${RADIO.hasta}:00 hs`,
} as const;

const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

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

/** ¿Estamos dentro del horario de La Rockola de Beethoven? */
export function enHorarioTomateve(ahora: Date) {
  const { dia, hora } = ahoraEnSanJuan(ahora);
  return (TOMATEVE.dias as readonly number[]).includes(dia) && hora >= TOMATEVE.desde && hora < TOMATEVE.hasta;
}

/** "Hoy a las 22:00", "Mañana a las 22:00" o "El jueves a las 22:00": la próxima vez que sale al aire. */
export function proximaTomateve(ahora: Date) {
  const { dia, hora } = ahoraEnSanJuan(ahora);
  for (let sumar = 0; sumar <= 7; sumar++) {
    const d = (dia + sumar) % 7;
    if (!(TOMATEVE.dias as readonly number[]).includes(d)) continue;
    if (sumar === 0 && hora >= TOMATEVE.desde) continue;
    const cuando = sumar === 0 ? "Hoy" : sumar === 1 ? "Mañana" : `El ${NOMBRE_DIA[d]}`;
    return `${cuando} a las ${TOMATEVE.desde}:00 hs`;
  }
  return TOMATEVE.horario;
}
