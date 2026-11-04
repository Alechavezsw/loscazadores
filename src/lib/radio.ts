/**
 * Radio del Sur (101.1 MHz, San Juan). El sitio la reproduce sola los sábados de 18 a 21 hs, hora de San Juan,
 * sin importar la zona horaria de quien la visita. Sirve en el navegador y en el servidor.
 */
export const RADIO = {
  nombre: "Radio del Sur",
  frecuencia: "101.1 MHz",
  ciudad: "San Juan",
  /** Transmisión en vivo (la misma que usa la página de la radio en myradioenvivo.ar). */
  stream: "https://cdn1.tvlin.net/icecast/radiodelsuraudio/icecast.audio",
  zona: "America/Argentina/San_Juan",
  /** 0 = domingo … 6 = sábado. */
  dia: 6,
  desde: 18,
  hasta: 21,
} as const;

export const HORARIO_RADIO = `Sábados de ${RADIO.desde} a ${RADIO.hasta} hs`;

const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const reloj = new Intl.DateTimeFormat("en-US", {
  timeZone: RADIO.zona,
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});

const fecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: RADIO.zona,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** ¿Estamos dentro del horario de la radio? Empieza a las 18:00 en punto y termina a las 21:00 en punto. */
export function enVentana(ahora: Date) {
  const p = Object.fromEntries(reloj.formatToParts(ahora).map((x) => [x.type, x.value]));
  const hora = Number(p.hour);
  return DIAS[p.weekday] === RADIO.dia && hora >= RADIO.desde && hora < RADIO.hasta;
}

/** Identifica cada sábado ("2026-10-31"), para recordar que alguien cerró el reproductor solo en esa emisión. */
export function ventanaId(ahora: Date) {
  return fecha.format(ahora);
}
