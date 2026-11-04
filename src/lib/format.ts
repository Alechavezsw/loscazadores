const ZONA = "America/Argentina/San_Juan";

const fechaCorta = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA,
});

const fechaLarga = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA,
});

/** "25 oct, 11:20". Es determinista, por eso sirve en el servidor. */
export function fechaBreve(iso: string) {
  return fechaCorta.format(new Date(iso));
}

export function fechaCompleta(iso: string) {
  return fechaLarga.format(new Date(iso));
}

export function resumen(texto: string, max = 180) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function parrafos(texto: string) {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * En lo importado de las redes el título sale de la primera línea del texto, así que el cuerpo
 * lo repite. Esto devuelve el cuerpo sin esa repetición, para no mostrar lo mismo dos veces.
 */
export function cuerpoSinTitulo(titulo: string, cuerpo: string) {
  const base = titulo.replace(/…$/, "").trim();
  const [primero = "", ...resto] = cuerpo.split(/\n{2,}/);
  const p = primero.trim();
  if (!base || !p.startsWith(base)) return cuerpo;
  const sobra = p.slice(base.length).replace(/^[\s:;,\u2013\u2014]+/, "").trim();
  return [sobra, ...resto].filter(Boolean).join("\n\n");
}
