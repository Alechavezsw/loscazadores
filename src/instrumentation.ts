export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // En Vercel cada pedido corre en una función que puede apagarse al terminar: un reloj interno no sirve.
  // Ahí la revisión la disparan el cron de vercel.json y las visitas al sitio.
  if (process.env.VERCEL) return;
  const { iniciarSincronizador } = await import("./lib/scheduler");
  iniciarSincronizador();
}
