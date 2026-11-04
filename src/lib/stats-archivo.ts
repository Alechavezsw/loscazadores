import "server-only";
import { promises as fs, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./store-base";
import { sumarDias } from "./stats-calculo";
import type { Fila } from "./stats-calculo";
import type { MotorStats } from "./stats-motor";

/**
 * Estadísticas en un archivo (stats.json en la carpeta de datos). Es lo que se usa en tu computadora y en un
 * servidor con disco propio. Todo se lleva en memoria y se escribe de a poco (cada 1,5 s), así que contar una
 * visita no reescribe el archivo cada vez. Pensado para un solo proceso: en Vercel se usa Postgres.
 */

type Contadores = Record<string, Record<string, number>>; // dimensión → clave → valor
type Estado = {
  dias: Record<string, Contadores>;
  /** día → id del visitante → [último movimiento, última página] */
  vis: Record<string, Record<string, [number, string]>>;
};

type Interno = { estado: Estado | null; carga: Promise<Estado> | null; timer: ReturnType<typeof setTimeout> | null; sucio: boolean; cola: Promise<void> };

declare global {
  var __lcStatsArchivo: Interno | undefined;
}

// Vive en globalThis para que el panel y la ruta que registra visitas compartan lo mismo aunque se compilen aparte.
const g = (globalThis.__lcStatsArchivo ??= { estado: null, carga: null, timer: null, sucio: false, cola: Promise.resolve() });

const ARCHIVO = path.join(DATA_DIR, "stats.json");
const CONSERVAR_DIAS = 400;

async function cargar(): Promise<Estado> {
  if (g.estado) return g.estado;
  g.carga ??= (async () => {
    try {
      const crudo = JSON.parse(await fs.readFile(ARCHIVO, "utf8")) as Partial<Estado>;
      g.estado = { dias: crudo.dias ?? {}, vis: crudo.vis ?? {} };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error("[stats] no se pudo leer stats.json:", (e as Error).message);
      g.estado = { dias: {}, vis: {} };
    }
    return g.estado;
  })();
  return g.carga;
}

function podar(e: Estado) {
  const dias = Object.keys(e.dias).sort();
  const ultimo = dias.at(-1);
  if (ultimo) {
    const corte = sumarDias(ultimo, -CONSERVAR_DIAS);
    for (const d of dias) if (d < corte) delete e.dias[d];
  }
  // Para saber si alguien es nuevo en el día alcanza con el día de hoy y el de ayer.
  const vis = Object.keys(e.vis).sort();
  for (const d of vis.slice(0, Math.max(0, vis.length - 2))) delete e.vis[d];
}

function escribirYa() {
  if (!g.estado) return;
  podar(g.estado);
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${ARCHIVO}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(g.estado), "utf8");
  // rename atómico: si algo se corta, queda el archivo anterior entero.
  return fs.rename(tmp, ARCHIVO);
}

function programar() {
  g.sucio = true;
  if (g.timer) return;
  g.timer = setTimeout(() => {
    g.timer = null;
    if (!g.sucio) return;
    g.sucio = false;
    g.cola = g.cola.then(() => escribirYa()).catch((e) => console.error("[stats] no se pudo guardar:", (e as Error).message));
  }, 1500);
  g.timer.unref?.();
}

// Al apagar el servidor se guarda lo que haya quedado sin escribir.
if (!(globalThis as { __lcStatsSalida?: boolean }).__lcStatsSalida) {
  (globalThis as { __lcStatsSalida?: boolean }).__lcStatsSalida = true;
  process.once("exit", () => {
    try {
      if (g.sucio && g.estado) {
        podar(g.estado);
        mkdirSync(DATA_DIR, { recursive: true });
        writeFileSync(ARCHIVO, JSON.stringify(g.estado), "utf8");
      }
    } catch {
      /* ya no hay a quién avisar */
    }
  });
}

export const motorStatsArchivo: MotorStats = {
  async tocar({ dia, id, ruta, ahora }) {
    const e = await cargar();
    const dia_ = (e.vis[dia] ??= {});
    const nuevo = !(id in dia_);
    dia_[id] = [ahora, ruta];
    programar();
    return nuevo;
  },

  async sumar(dia, incrementos) {
    if (incrementos.length === 0) return;
    const e = await cargar();
    const contadores = (e.dias[dia] ??= {});
    for (const [dim, clave, n] of incrementos) {
      const porClave = (contadores[dim] ??= {});
      porClave[clave] = (porClave[clave] ?? 0) + n;
    }
    programar();
  },

  async leer(desde, hasta) {
    const e = await cargar();
    const filas: Fila[] = [];
    for (const [dia, contadores] of Object.entries(e.dias)) {
      if (dia < desde || dia > hasta) continue;
      for (const [dim, porClave] of Object.entries(contadores)) {
        for (const [clave, valor] of Object.entries(porClave)) filas.push({ dia, dim, clave, valor });
      }
    }
    return filas;
  },

  async activos(desdeMs) {
    const e = await cargar();
    const lista: Array<{ id: string; ruta: string; ultimo: number }> = [];
    for (const visitantes of Object.values(e.vis)) {
      for (const [id, [ultimo, ruta]] of Object.entries(visitantes)) if (ultimo >= desdeMs) lista.push({ id, ruta, ultimo });
    }
    return lista;
  },
};
