/**
 * Convierte los contadores diarios en el panel de estadísticas. Es un cálculo puro (sin base ni archivos) para
 * que sea el mismo con cualquier almacenamiento y se pueda probar aparte.
 *
 * Lo que se guarda son contadores por día: (día, dimensión, clave) → valor. Las dimensiones son:
 *   t        totales: vistas, visitantes, entradas, seg, seg_n
 *   h        vistas por hora del día ("00" a "23")
 *   ruta     vistas por página; ruta_seg y ruta_n son los segundos leídos y cuántas lecturas se midieron
 *   fuente   entradas por origen (Google, Facebook, Directo…); ref, los sitios concretos; campana, los utm_campaign
 *   disp, nav, so          visitantes por aparato, navegador y sistema
 *   pais, prov, ciudad     visitantes por lugar
 *   accion   veces que se hizo cada acción
 *   adv, adc vistas y clics por anuncio
 */

export type Fila = { dia: string; dim: string; clave: string; valor: number };
export type Par = { clave: string; valor: number };

export type Totales = { visitantes: number; vistas: number; entradas: number; seg: number; segN: number };

export type PuntoSerie = { clave: string; vistas: number; visitantes: number | null };

export type FilaPagina = { ruta: string; vistas: number; seg: number; lecturas: number };

export type FilaAnuncio = { id: string; vistas: number; clics: number };

export type Panel = {
  desde: string;
  hasta: string;
  dias: number;
  totales: Totales;
  previo: Totales;
  /** Por hora cuando el período es un solo día; por día en los demás. */
  serie: PuntoSerie[];
  porHora: PuntoSerie[];
  porSemana: Par[];
  paginas: FilaPagina[];
  fuentes: Par[];
  referentes: Par[];
  campanas: Par[];
  dispositivos: Par[];
  navegadores: Par[];
  sistemas: Par[];
  paises: Par[];
  provincias: Par[];
  ciudades: Par[];
  acciones: Par[];
  anuncios: FilaAnuncio[];
  hayDatos: boolean;
};

// ───────────────────────── fechas ─────────────────────────

/** Los días y las horas se cuentan en hora de San Juan, sin importar dónde corra el servidor. */
export const ZONA_STATS = "America/Argentina/San_Juan";

const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_STATS, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("en-US", { timeZone: ZONA_STATS, hour: "2-digit", hourCycle: "h23" });

/** "2026-10-27" */
export const diaDe = (ms: number) => fmtDia.format(ms);
/** "00" a "23" */
export const horaDe = (ms: number) => fmtHora.format(ms).padStart(2, "0");

const MS_DIA = 86_400_000;

const aUTC = (dia: string) => {
  const [a, m, d] = dia.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

const aTexto = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function sumarDias(dia: string, n: number): string {
  return aTexto(aUTC(dia) + n * MS_DIA);
}

/** Los `n` días que terminan en `hasta`, del más viejo al más nuevo. */
export function listarDias(hasta: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => sumarDias(hasta, i - (n - 1)));
}

const NOMBRES_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Lunes = 0 … domingo = 6. */
const diaDeSemana = (dia: string) => (new Date(aUTC(dia)).getUTCDay() + 6) % 7;

// ───────────────────────── armado ─────────────────────────

type Indice = Map<string, Map<string, Map<string, number>>>;

function indexar(filas: Fila[]): Indice {
  const ix: Indice = new Map();
  for (const f of filas) {
    let porDim = ix.get(f.dia);
    if (!porDim) ix.set(f.dia, (porDim = new Map()));
    let porClave = porDim.get(f.dim);
    if (!porClave) porDim.set(f.dim, (porClave = new Map()));
    porClave.set(f.clave, (porClave.get(f.clave) ?? 0) + f.valor);
  }
  return ix;
}

const valorDe = (ix: Indice, dia: string, dim: string, clave: string) => ix.get(dia)?.get(dim)?.get(clave) ?? 0;

function totalesDe(ix: Indice, dias: string[]): Totales {
  const t: Totales = { visitantes: 0, vistas: 0, entradas: 0, seg: 0, segN: 0 };
  for (const d of dias) {
    t.visitantes += valorDe(ix, d, "t", "visitantes");
    t.vistas += valorDe(ix, d, "t", "vistas");
    t.entradas += valorDe(ix, d, "t", "entradas");
    t.seg += valorDe(ix, d, "t", "seg");
    t.segN += valorDe(ix, d, "t", "seg_n");
  }
  return t;
}

/** Suma una dimensión en todo el período y la ordena de mayor a menor. */
function sumarDim(ix: Indice, dias: string[], dim: string): Par[] {
  const acumulado = new Map<string, number>();
  for (const d of dias) {
    const m = ix.get(d)?.get(dim);
    if (!m) continue;
    for (const [clave, valor] of m) acumulado.set(clave, (acumulado.get(clave) ?? 0) + valor);
  }
  return [...acumulado].map(([clave, valor]) => ({ clave, valor })).sort((a, b) => b.valor - a.valor || a.clave.localeCompare(b.clave));
}

/**
 * `filas` tiene que traer el período pedido y el anterior de igual largo (para comparar).
 * `hasta` es el último día del período, normalmente hoy en San Juan.
 */
export function armarPanel(filas: Fila[], hasta: string, dias: number): Panel {
  const ix = indexar(filas);
  const periodo = listarDias(hasta, dias);
  const anterior = listarDias(sumarDias(hasta, -dias), dias);

  const totales = totalesDe(ix, periodo);

  const horas = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
  const porHora: PuntoSerie[] = horas.map((h) => ({
    clave: h,
    vistas: periodo.reduce((s, d) => s + valorDe(ix, d, "h", h), 0),
    visitantes: null,
  }));

  const serie: PuntoSerie[] =
    dias === 1
      ? porHora
      : periodo.map((d) => ({ clave: d, vistas: valorDe(ix, d, "t", "vistas"), visitantes: valorDe(ix, d, "t", "visitantes") }));

  const semana = new Array<number>(7).fill(0);
  for (const d of periodo) semana[diaDeSemana(d)] += valorDe(ix, d, "t", "vistas");
  const porSemana: Par[] = NOMBRES_SEMANA.map((clave, i) => ({ clave, valor: semana[i] }));

  const vistasPorRuta = sumarDim(ix, periodo, "ruta");
  const seg = new Map(sumarDim(ix, periodo, "ruta_seg").map((p) => [p.clave, p.valor]));
  const lecturas = new Map(sumarDim(ix, periodo, "ruta_n").map((p) => [p.clave, p.valor]));
  const paginas: FilaPagina[] = vistasPorRuta.map((p) => ({
    ruta: p.clave,
    vistas: p.valor,
    seg: seg.get(p.clave) ?? 0,
    lecturas: lecturas.get(p.clave) ?? 0,
  }));

  const vistasAd = new Map(sumarDim(ix, periodo, "adv").map((p) => [p.clave, p.valor]));
  const clicsAd = new Map(sumarDim(ix, periodo, "adc").map((p) => [p.clave, p.valor]));
  const idsAd = new Set([...vistasAd.keys(), ...clicsAd.keys()]);
  const anuncios: FilaAnuncio[] = [...idsAd]
    .map((id) => ({ id, vistas: vistasAd.get(id) ?? 0, clics: clicsAd.get(id) ?? 0 }))
    .sort((a, b) => b.vistas - a.vistas || b.clics - a.clics);

  return {
    desde: periodo[0],
    hasta,
    dias,
    totales,
    previo: totalesDe(ix, anterior),
    serie,
    porHora,
    porSemana,
    paginas,
    fuentes: sumarDim(ix, periodo, "fuente"),
    referentes: sumarDim(ix, periodo, "ref"),
    campanas: sumarDim(ix, periodo, "campana"),
    dispositivos: sumarDim(ix, periodo, "disp"),
    navegadores: sumarDim(ix, periodo, "nav"),
    sistemas: sumarDim(ix, periodo, "so"),
    paises: sumarDim(ix, periodo, "pais"),
    provincias: sumarDim(ix, periodo, "prov"),
    ciudades: sumarDim(ix, periodo, "ciudad"),
    acciones: sumarDim(ix, periodo, "accion"),
    anuncios,
    hayDatos: totales.vistas > 0 || totales.visitantes > 0,
  };
}

// ───────────────────────── ayudas de presentación ─────────────────────────

/** Variación contra el período anterior. null cuando no hay con qué comparar. */
export function variacion(actual: number, previo: number): number | null {
  if (previo <= 0) return null;
  return (actual - previo) / previo;
}

export function promedio(suma: number, n: number): number {
  return n > 0 ? suma / n : 0;
}
