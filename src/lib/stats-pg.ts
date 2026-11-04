import "server-only";
import { conexion } from "./store-pg";
import type { Fila } from "./stats-calculo";
import { juntar, type MotorStats } from "./stats-motor";

/**
 * Estadísticas en Postgres (para Vercel). Dos tablas chicas, que se crean solas:
 *   lc_stats    un contador por (día, dimensión, clave). Crece con la variedad de páginas y orígenes, no con las
 *               visitas, así que sigue liviana aunque el tráfico suba.
 *   lc_activos  un renglón por visitante y día (id anónimo, último movimiento y página). Sirve para saber quién es
 *               nuevo en el día y cuántos hay conectados ahora; se limpia sola pasados unos días.
 * Cada visita es una sola escritura por tabla, sin candados: los contadores se suman dentro de la base.
 */

let esquema: Promise<void> | undefined;
function asegurarEsquema() {
  esquema ??= conexion()
    .query(
      `CREATE TABLE IF NOT EXISTS lc_stats (
         dia date NOT NULL,
         dim text NOT NULL,
         clave text NOT NULL,
         valor bigint NOT NULL DEFAULT 0,
         PRIMARY KEY (dia, dim, clave)
       );
       CREATE TABLE IF NOT EXISTS lc_activos (
         dia date NOT NULL,
         id text NOT NULL,
         ultimo timestamptz NOT NULL,
         ruta text NOT NULL DEFAULT '',
         PRIMARY KEY (dia, id)
       );
       CREATE INDEX IF NOT EXISTS lc_activos_ultimo ON lc_activos (ultimo DESC);`,
    )
    .then(() => undefined)
    .catch((e) => {
      esquema = undefined;
      throw e;
    });
  return esquema;
}

export const motorStatsPg: MotorStats = {
  async tocar({ dia, id, ruta, ahora }) {
    await asegurarEsquema();
    const r = await conexion().query<{ nuevo: boolean }>(
      `INSERT INTO lc_activos (dia, id, ultimo, ruta)
       VALUES ($1::date, $2, to_timestamp($3::double precision / 1000), $4)
       ON CONFLICT (dia, id) DO UPDATE SET ultimo = EXCLUDED.ultimo, ruta = EXCLUDED.ruta
       RETURNING (xmax = 0) AS nuevo`,
      [dia, id, ahora, ruta],
    );
    // De vez en cuando se borran los renglones viejos: no hace falta un proceso aparte.
    if (Math.random() < 1 / 300) {
      conexion()
        .query("DELETE FROM lc_activos WHERE ultimo < now() - interval '3 days'")
        .catch(() => undefined);
    }
    return r.rows[0]?.nuevo ?? false;
  },

  async sumar(dia, incrementos) {
    const lista = juntar(incrementos);
    if (lista.length === 0) return;
    await asegurarEsquema();
    const valores: string[] = [];
    const params: unknown[] = [dia];
    for (const [dim, clave, n] of lista) {
      params.push(dim, clave, n);
      const i = params.length;
      valores.push(`($1::date, $${i - 2}, $${i - 1}, $${i}::bigint)`);
    }
    await conexion().query(
      `INSERT INTO lc_stats (dia, dim, clave, valor) VALUES ${valores.join(", ")}
       ON CONFLICT (dia, dim, clave) DO UPDATE SET valor = lc_stats.valor + EXCLUDED.valor`,
      params,
    );
  },

  async leer(desde, hasta) {
    await asegurarEsquema();
    const r = await conexion().query<{ dia: string; dim: string; clave: string; valor: string }>(
      `SELECT to_char(dia, 'YYYY-MM-DD') AS dia, dim, clave, valor
       FROM lc_stats WHERE dia BETWEEN $1::date AND $2::date`,
      [desde, hasta],
    );
    return r.rows.map((f): Fila => ({ dia: f.dia, dim: f.dim, clave: f.clave, valor: Number(f.valor) }));
  },

  async activos(desdeMs) {
    await asegurarEsquema();
    const r = await conexion().query<{ id: string; ruta: string; ultimo: string }>(
      `SELECT id, ruta, (extract(epoch FROM ultimo) * 1000)::bigint AS ultimo
       FROM lc_activos WHERE ultimo >= to_timestamp($1::double precision / 1000)`,
      [desdeMs],
    );
    return r.rows.map((f) => ({ id: f.id, ruta: f.ruta, ultimo: Number(f.ultimo) }));
  },
};
