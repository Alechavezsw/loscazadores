import type { NombreAccion } from "./stats-acciones";

/** Manda un aviso a las estadísticas. Nunca interrumpe la página: si algo falla, se ignora. */
export function enviarEvento(datos: Record<string, unknown>) {
  try {
    const cuerpo = JSON.stringify(datos);
    // sendBeacon sigue funcionando aunque la pestaña se esté cerrando.
    if (navigator.sendBeacon?.("/api/e", new Blob([cuerpo], { type: "application/json" }))) return;
    void fetch("/api/e", { method: "POST", body: cuerpo, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
  } catch {
    /* las estadísticas nunca deben romper el sitio */
  }
}

/** Para acciones que no son un clic en un enlace, como que la radio arranque. */
export function registrarAccion(a: NombreAccion) {
  enviarEvento({ t: "a", r: location.pathname, a });
}
