import "server-only";
import { Pool } from "pg";
import { completar, seed, urlPostgres, type Motor } from "./store-base";
import type { Db } from "./types";
import { TROZO_VIDEO_BYTES } from "./video-limites";

/**
 * Motor Postgres, para hostings sin disco propio como Vercel.
 *
 * Los ajustes, las conexiones y los anuncios son documentos chicos (tabla lc_kv) y cada noticia es una fila
 * (tabla lc_noticias), así que guardar una noticia no reescribe todas las demás. Las tablas se crean solas
 * la primera vez. Cada cambio corre dentro de una transacción con un candado, de modo que dos instancias del
 * servidor (el panel, un aviso de Make y el cron a la vez) nunca se pisan.
 */

const CANDADO = 7740131;

declare global {
  var __lcPool: Pool | undefined;
}

/**
 * Cuántas conexiones abre este proceso. El pooler en modo sesión reparte 15 entre todo el proyecto
 * (el build, el sitio publicado y la computadora de desarrollo). Una por proceso alcanza: las consultas
 * esperan su turno en vez de abrir otra.
 */
function topeDelPool() {
  if (process.env.NEXT_PHASE === "phase-production-build") return 1;
  const pedido = Number(process.env.PGPOOL_MAX);
  return Number.isFinite(pedido) && pedido >= 1 ? pedido : 1;
}

function poolLleno(e: unknown) {
  if (typeof e !== "object" || e === null || !("message" in e)) return false;
  const mensaje = String((e as { message: unknown }).message);
  return mensaje.includes("EMAXCONNSESSION") || mensaje.includes("max clients reached");
}

/** Vuelve a intentar si el pooler no tenía un lugar libre en ese momento. */
async function conCupo<T>(trabajo: () => Promise<T>): Promise<T> {
  let espera = 500;
  for (let intento = 0; ; intento++) {
    try {
      return await trabajo();
    } catch (e) {
      if (intento >= 5 || !poolLleno(e)) throw e;
      await new Promise((resolver) => setTimeout(resolver, espera));
      espera *= 2;
    }
  }
}

// El pool vive en globalThis para que el recargado de módulos en desarrollo no abra conexiones de más.
// Las estadísticas usan este mismo pool.
export function conexion() {
  const max = topeDelPool();
  const anterior = globalThis.__lcPool;
  if (anterior && anterior.options.max !== max) {
    void anterior.end().catch(() => undefined);
    globalThis.__lcPool = undefined;
  }
  if (!globalThis.__lcPool) {
    const pool = new Pool({
      connectionString: urlPostgres(),
      max,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
    const consultar = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;
    const conectar = pool.connect.bind(pool) as (...args: unknown[]) => Promise<unknown>;
    pool.query = ((...args: unknown[]) => conCupo(() => consultar(...args))) as typeof pool.query;
    pool.connect = ((...args: unknown[]) => conCupo(() => conectar(...args))) as typeof pool.connect;
    globalThis.__lcPool = pool;
  }
  return globalThis.__lcPool;
}

let esquema: Promise<void> | undefined;
function asegurarEsquema() {
  esquema ??= conexion()
    .query(
      `CREATE TABLE IF NOT EXISTS lc_kv (
         clave text PRIMARY KEY,
         valor jsonb NOT NULL
       );
       CREATE TABLE IF NOT EXISTS lc_noticias (
         id text PRIMARY KEY,
         creada timestamptz NOT NULL,
         datos jsonb NOT NULL
       );
       CREATE INDEX IF NOT EXISTS lc_noticias_creada ON lc_noticias (creada DESC);
       CREATE TABLE IF NOT EXISTS lc_imagenes (
         nombre text PRIMARY KEY,
         datos bytea NOT NULL
       );
       CREATE TABLE IF NOT EXISTS lc_videos (
         nombre text PRIMARY KEY,
         tipo text NOT NULL,
         bytes bigint NOT NULL,
         completo boolean NOT NULL DEFAULT false,
         creada timestamptz NOT NULL DEFAULT now()
       );
       CREATE TABLE IF NOT EXISTS lc_video_trozos (
         nombre text NOT NULL REFERENCES lc_videos (nombre) ON DELETE CASCADE,
         n integer NOT NULL,
         inicio bigint NOT NULL,
         largo integer NOT NULL,
         datos bytea NOT NULL,
         PRIMARY KEY (nombre, n)
       );`,
    )
    .then(() => undefined)
    .catch((e) => {
      esquema = undefined;
      throw e;
    });
  return esquema;
}

type Consulta = { query: Pool["query"] };

/** Cómo estaba cada pieza al leerla, para escribir después solo lo que cambió. */
type Foto = { kv: Map<string, string>; noticias: Map<string, string> };

function fotoDe(db: Db): Foto {
  return {
    kv: new Map<string, string>([
      ["ajustes", JSON.stringify(db.ajustes)],
      ["meta", JSON.stringify(db.meta)],
      ["anuncios", JSON.stringify(db.anuncios)],
      ["sincensura", JSON.stringify(db.sinCensura)],
    ]),
    noticias: new Map(db.noticias.map((n) => [n.id, JSON.stringify(n)])),
  };
}

async function cargar(q: Consulta): Promise<Db | null> {
  const kv = await q.query<{ clave: string; valor: unknown }>("SELECT clave, valor FROM lc_kv");
  const nt = await q.query<{ datos: Db["noticias"][number] }>("SELECT datos FROM lc_noticias ORDER BY creada DESC");
  if (kv.rowCount === 0 && nt.rowCount === 0) return null;
  const doc = new Map(kv.rows.map((r) => [r.clave, r.valor]));
  return completar({
    ajustes: doc.get("ajustes") as Db["ajustes"] | undefined,
    meta: doc.get("meta") as Db["meta"] | undefined,
    anuncios: doc.get("anuncios") as Db["anuncios"] | undefined,
    sinCensura: doc.get("sincensura") as Db["sinCensura"] | undefined,
    noticias: nt.rows.map((r) => r.datos),
  });
}

async function escribir(q: Consulta, db: Db, antes: Foto) {
  const despues = fotoDe(db);

  for (const [clave, texto] of despues.kv) {
    if (antes.kv.get(clave) === texto) continue;
    await q.query(
      "INSERT INTO lc_kv (clave, valor) VALUES ($1, $2::jsonb) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor",
      [clave, texto],
    );
  }

  for (const n of db.noticias) {
    const texto = despues.noticias.get(n.id)!;
    if (antes.noticias.get(n.id) === texto) continue;
    await q.query(
      "INSERT INTO lc_noticias (id, creada, datos) VALUES ($1, $2::timestamptz, $3::jsonb) ON CONFLICT (id) DO UPDATE SET creada = EXCLUDED.creada, datos = EXCLUDED.datos",
      [n.id, n.creada, texto],
    );
  }

  const quedan = new Set(db.noticias.map((n) => n.id));
  const borrar = [...antes.noticias.keys()].filter((id) => !quedan.has(id));
  if (borrar.length > 0) await q.query("DELETE FROM lc_noticias WHERE id = ANY($1::text[])", [borrar]);
}

/** Guarda los bytes de una foto ya procesada. El nombre es el que queda en la noticia y se sirve desde /media. */
export async function guardarImagenEnBd(nombre: string, datos: Buffer) {
  await asegurarEsquema();
  await conexion().query(
    "INSERT INTO lc_imagenes (nombre, datos) VALUES ($1, $2) ON CONFLICT (nombre) DO UPDATE SET datos = EXCLUDED.datos",
    [nombre, datos],
  );
}

/** Lee una foto por su nombre, o null si no está. */
export async function leerImagenEnBd(nombre: string): Promise<Buffer | null> {
  await asegurarEsquema();
  const r = await conexion().query<{ datos: Buffer }>("SELECT datos FROM lc_imagenes WHERE nombre = $1", [nombre]);
  const datos = r.rows[0]?.datos;
  if (!datos) return null;
  return Buffer.isBuffer(datos) ? datos : Buffer.from(datos);
}

export async function borrarImagenEnBd(nombre: string) {
  await asegurarEsquema();
  await conexion().query("DELETE FROM lc_imagenes WHERE nombre = $1", [nombre]);
}

// ───────────────────────────── Videos ─────────────────────────────
// Un video se guarda en trozos (lc_video_trozos) porque una función de Vercel no recibe pedidos de más de 4,5 MB:
// el panel manda un trozo por pedido. Mientras no se cierra la subida, la fila de lc_videos queda incompleta y el
// video no se sirve. Los trozos se borran solos con su video (ON DELETE CASCADE).

export type InfoVideo = { tipo: string; bytes: number; completo: boolean };

/** Abre la subida de un video. De paso limpia las subidas que quedaron a medias hace más de dos horas. */
export async function iniciarVideoEnBd(nombre: string, tipo: string, bytes: number) {
  await asegurarEsquema();
  const q = conexion();
  await q.query("DELETE FROM lc_videos WHERE NOT completo AND creada < now() - interval '2 hours'");
  await q.query("INSERT INTO lc_videos (nombre, tipo, bytes) VALUES ($1, $2, $3)", [nombre, tipo, bytes]);
}

export async function infoVideoEnBd(nombre: string): Promise<InfoVideo | null> {
  await asegurarEsquema();
  const r = await conexion().query<{ tipo: string; bytes: string; completo: boolean }>(
    "SELECT tipo, bytes, completo FROM lc_videos WHERE nombre = $1",
    [nombre],
  );
  const f = r.rows[0];
  return f ? { tipo: f.tipo, bytes: Number(f.bytes), completo: f.completo } : null;
}

/** Guarda un trozo. Si el navegador lo reenvía (por un corte), lo reemplaza. */
export async function guardarTrozoVideoEnBd(nombre: string, n: number, inicio: number, datos: Buffer) {
  await asegurarEsquema();
  await conexion().query(
    `INSERT INTO lc_video_trozos (nombre, n, inicio, largo, datos) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (nombre, n) DO UPDATE SET inicio = EXCLUDED.inicio, largo = EXCLUDED.largo, datos = EXCLUDED.datos`,
    [nombre, n, inicio, datos.length, datos],
  );
}

/** Cierra la subida si están todos los trozos y suman lo declarado. Si no, borra lo subido y devuelve false. */
export async function terminarVideoEnBd(nombre: string): Promise<boolean> {
  await asegurarEsquema();
  const r = await conexion().query(
    `UPDATE lc_videos v SET completo = true
      WHERE v.nombre = $1 AND NOT v.completo
        AND (SELECT coalesce(sum(largo), 0) FROM lc_video_trozos WHERE nombre = v.nombre) = v.bytes
        AND (SELECT count(*) FROM lc_video_trozos WHERE nombre = v.nombre) = ceil(v.bytes::numeric / $2::numeric)`,
    [nombre, TROZO_VIDEO_BYTES],
  );
  if (r.rowCount === 1) return true;
  await borrarVideoEnBd(nombre);
  return false;
}

/** Las medidas de los trozos que cubren el tramo [inicio, fin] del video (los bytes se leen de a uno). */
export async function trozosDeVideoEnBd(nombre: string, inicio: number, fin: number) {
  await asegurarEsquema();
  const r = await conexion().query<{ n: number; inicio: string; largo: number }>(
    `SELECT n, inicio, largo FROM lc_video_trozos
      WHERE nombre = $1 AND inicio <= $3 AND inicio + largo > $2
      ORDER BY n`,
    [nombre, inicio, fin],
  );
  return r.rows.map((x) => ({ n: x.n, inicio: Number(x.inicio), largo: x.largo }));
}

export async function leerTrozoVideoEnBd(nombre: string, n: number): Promise<Buffer | null> {
  await asegurarEsquema();
  const r = await conexion().query<{ datos: Buffer }>("SELECT datos FROM lc_video_trozos WHERE nombre = $1 AND n = $2", [nombre, n]);
  const datos = r.rows[0]?.datos;
  if (!datos) return null;
  return Buffer.isBuffer(datos) ? datos : Buffer.from(datos);
}

export async function borrarVideoEnBd(nombre: string) {
  await asegurarEsquema();
  await conexion().query("DELETE FROM lc_videos WHERE nombre = $1", [nombre]);
}

export const motorPg: Motor = {
  async leer() {
    await asegurarEsquema();
    return cargar(conexion());
  },

  async leerConfig() {
    await asegurarEsquema();
    const r = await conexion().query<{ clave: string; valor: unknown }>(
      "SELECT clave, valor FROM lc_kv WHERE clave = ANY($1::text[])",
      [["ajustes", "meta"]],
    );
    if (r.rowCount === 0) return null;
    const doc = new Map(r.rows.map((x) => [x.clave, x.valor]));
    const db = completar({ ajustes: doc.get("ajustes") as Db["ajustes"] | undefined, meta: doc.get("meta") as Db["meta"] | undefined });
    return { ajustes: db.ajustes, meta: db.meta };
  },

  async mutar(cambio) {
    await asegurarEsquema();
    const c = await conexion().connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock($1::bigint)", [CANDADO]);
      const guardado = await cargar(c);
      const db = guardado ?? seed();
      // Si todavía no había nada guardado, todo lo que haya (el contenido de muestra incluido) se considera nuevo.
      const antes = guardado ? fotoDe(guardado) : { kv: new Map<string, string>(), noticias: new Map<string, string>() };
      const resultado = await cambio(db);
      await escribir(c, db, antes);
      await c.query("COMMIT");
      return resultado;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      c.release();
    }
  },
};
