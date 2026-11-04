import "server-only";
import { revisarPendientes } from "./pendientes";

const REVISION_MS = 60_000;

declare global {
  var __lcSincronizador: ReturnType<typeof setInterval> | undefined;
}

/**
 * Reloj interno para cuando el sitio corre en un servidor propio, que queda encendido: cada minuto mira si
 * toca importar. En Vercel no se arranca (no hay proceso fijo): ahí lo hacen el cron y las visitas.
 * Los avisos de Make o Zapier no pasan por acá: llegan solos a /api/importar.
 */
export function iniciarSincronizador() {
  if (globalThis.__lcSincronizador) return;

  const revisar = () =>
    revisarPendientes({ ignorarIntervalo: false }).catch((e) =>
      console.error("[sincronizador]", e instanceof Error ? e.message : "error inesperado"),
    );

  globalThis.__lcSincronizador = setInterval(revisar, REVISION_MS);
  globalThis.__lcSincronizador.unref?.();
  // Primera revisión poco después de arrancar, para no esperar un minuto entero.
  setTimeout(revisar, 15_000).unref?.();
}
