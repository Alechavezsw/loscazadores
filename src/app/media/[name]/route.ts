import { promises as fs } from "node:fs";
import path from "node:path";
import { NOMBRE_VALIDO } from "@/lib/images";
import { UPLOADS_DIR } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!NOMBRE_VALIDO.test(name)) return new Response("No encontrado", { status: 404 });
  try {
    const archivo = await fs.readFile(path.join(UPLOADS_DIR, name));
    return new Response(new Uint8Array(archivo), {
      headers: {
        "Content-Type": "image/webp",
        // El nombre es un hash aleatorio: nunca cambia el contenido de una URL.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
