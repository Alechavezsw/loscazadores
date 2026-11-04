import { after, connection } from "next/server";
import { getAjustes } from "@/lib/queries";
import { getLiveStatus } from "@/lib/live";
import { revisarPendientes } from "@/lib/pendientes";

// Después de responder se puede importar lo pendiente, que baja fotos y tarda.
export const maxDuration = 60;

export async function GET(request: Request) {
  // Siempre al momento: nunca se sirve una respuesta armada durante la compilación.
  await connection();
  const ajustes = await getAjustes();
  // ?canal=tomateve pregunta por el canal de TOMATEVE; sin parámetro, por el canal propio.
  const deTomateve = new URL(request.url).searchParams.get("canal") === "tomateve";
  const estado = await getLiveStatus(
    deTomateve ? { youtube: ajustes.tomateve, youtubeModo: "auto", youtubeVideoManual: "" } : ajustes,
  );

  // Cada visitante consulta esto una vez por minuto, así que sirve de reloj cuando no hay un servidor
  // encendido (Vercel). Si no toca importar, revisarPendientes vuelve enseguida.
  after(() =>
    revisarPendientes().catch((e) => console.error("[live] pendientes:", e instanceof Error ? e.message : "error")),
  );

  return Response.json(estado, {
    headers: { "Cache-Control": "no-store" },
  });
}
