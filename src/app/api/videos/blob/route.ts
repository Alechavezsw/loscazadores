import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { connection } from "next/server";
import { esAdmin } from "@/lib/auth";
import { MAX_VIDEO_BYTES, TIPOS_VIDEO } from "@/lib/videos";

/**
 * Entrega al navegador un permiso de un solo uso para subir un video directo a Vercel Blob, sin pasar el archivo
 * por el servidor (una función de Vercel no recibe pedidos de más de 4,5 MB). El permiso solo se da a quien está
 * en el panel y solo para videos de hasta 200 MB, dentro de la carpeta videos/.
 */
export async function POST(req: Request) {
  await connection();

  let cuerpo: HandleUploadBody;
  try {
    cuerpo = (await req.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const respuesta = await handleUpload({
      body: cuerpo,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await esAdmin())) throw new Error("No autorizado");
        if (!pathname.startsWith("videos/")) throw new Error("Carpeta no permitida");
        return {
          allowedContentTypes: [...TIPOS_VIDEO],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 31_536_000,
        };
      },
      // Vercel avisa acá cuando termina la subida. No hace falta hacer nada: la dirección se guarda al publicar la nota.
      onUploadCompleted: async () => undefined,
    });
    return Response.json(respuesta);
  } catch (e) {
    const sinPermiso = e instanceof Error && /autorizado|permitida/i.test(e.message);
    return Response.json({ error: sinPermiso ? "No autorizado." : "No se pudo preparar la subida." }, { status: sinPermiso ? 401 : 400 });
  }
}
