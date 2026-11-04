import { connection } from "next/server";
import { leerImagenGuardada, NOMBRE_VALIDO } from "@/lib/images";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  await connection();
  const { name } = await params;
  if (!NOMBRE_VALIDO.test(name)) return new Response("No encontrado", { status: 404 });
  const archivo = await leerImagenGuardada(name);
  if (!archivo) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
