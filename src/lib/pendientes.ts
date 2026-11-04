import "server-only";
import { mutateDb, readConfig } from "./store";
import { sincronizar, sincronizarFeed, type ResultadoFeed, type ResultadoSync } from "./sync";

/**
 * Revisa qué conexiones e enlaces de feed ya les toca importar y lo hace. Lo usan tres disparadores,
 * porque en Vercel no hay un proceso encendido que lo haga solo:
 *  - el cron de Vercel (ruta /api/sync),
 *  - las visitas al sitio (la ruta /api/live, que cada visitante consulta una vez por minuto),
 *  - el servidor propio, con un reloj interno (instrumentation.ts).
 * Antes de trabajar se "reclama el turno" anotando la hora en la base, para que dos instancias que
 * llegan a la vez no importen lo mismo.
 */

const MARGEN_MS = 5_000;
const ENTRE_CONSULTAS_MS = 30_000;

const toca = (ultima: string | null, cadaMin: number) =>
  Date.now() - (ultima ? Date.parse(ultima) : 0) >= cadaMin * 60_000 - MARGEN_MS;

export type ResultadoPendientes = {
  /** Por qué no se hizo nada, si fue así. */
  omitido?: "apagado" | "reciente";
  meta: ResultadoSync | null;
  feeds: Array<{ nombre: string } & ResultadoFeed>;
};

let ultimaConsulta = 0;

export async function revisarPendientes({ ignorarIntervalo = false } = {}): Promise<ResultadoPendientes> {
  const vacio: ResultadoPendientes = { meta: null, feeds: [] };

  // Cada visitante pregunta por la transmisión cada minuto: no hace falta mirar la base más de dos veces por minuto.
  if (!ignorarIntervalo) {
    if (Date.now() - ultimaConsulta < ENTRE_CONSULTAS_MS) return { ...vacio, omitido: "reciente" };
    ultimaConsulta = Date.now();
  }

  const { meta, ajustes } = await readConfig();
  if (!ajustes.sincronizar) return { ...vacio, omitido: "apagado" };
  const cada = ajustes.sincronizarCadaMin;
  const resultado = { ...vacio };

  // Con el token rechazado no tiene sentido insistir: hay que volver a conectar desde el panel.
  if (meta.conexion && !meta.estado.reconectar && (ignorarIntervalo || toca(meta.estado.ultima, cada))) {
    const turno = await mutateDb((db) => {
      if (!db.meta.conexion) return false;
      if (!ignorarIntervalo && !toca(db.meta.estado.ultima, cada)) return false;
      db.meta.estado.ultima = new Date().toISOString();
      return true;
    });
    if (turno) {
      resultado.meta = await sincronizar().catch((e) => {
        console.error("[pendientes] Meta:", e instanceof Error ? e.message : "error inesperado");
        return null;
      });
    }
  }

  // Un feed que falla no frena a los demás.
  for (const feed of meta.feeds) {
    if (!ignorarIntervalo && !toca(feed.ultima, cada)) continue;
    const turno = await mutateDb((db) => {
      const f = db.meta.feeds.find((x) => x.id === feed.id);
      if (!f) return false;
      if (!ignorarIntervalo && !toca(f.ultima, cada)) return false;
      f.ultima = new Date().toISOString();
      return true;
    });
    if (!turno) continue;
    const r = await sincronizarFeed(feed.id).catch((e) => {
      console.error(`[pendientes] feed ${feed.nombre}:`, e instanceof Error ? e.message : "error inesperado");
      return null;
    });
    if (r) resultado.feeds.push({ nombre: feed.nombre, ...r });
  }

  return resultado;
}
