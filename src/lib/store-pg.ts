import "server-only";
import { Pool } from "pg";
import { completar, seed, urlPostgres, type Motor } from "./store-base";
import type { Db } from "./types";

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

// El pool vive en globalThis para que el recargado de módulos en desarrollo no abra conexiones de más.
// Las estadísticas usan este mismo pool.
export function conexion() {
  globalThis.__lcPool ??= new Pool({
    connectionString: urlPostgres(),
    // En una función serverless cada instancia necesita pocas conexiones. Neon las junta en su pooler.
    max: Number(process.env.PGPOOL_MAX ?? 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
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
       CREATE INDEX IF NOT EXISTS lc_noticias_creada ON lc_noticias (creada DESC);`,
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
