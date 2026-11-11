import { connection } from "next/server";
import { esAdmin } from "@/lib/auth";
import { ErrorImagen, guardarImagen } from "@/lib/images";

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Recibe una foto para poner dentro del texto de una noticia y devuelve lo que se anota en el contenido.
 * A diferencia de la imagen de portada, que viaja con el formulario, estas se suben apenas se eligen, porque el
 * editor necesita mostrarlas en su lugar. Solo sirve para quien está en el panel.
 */
export async function POST(req: Request) {
  await connection();
  if (!(await esAdmin())) return json({ error: "Tenés que entrar al panel para subir fotos." }, 401);

  let archivo: FormDataEntryValue | null = null;
  try {
    archivo = (await req.formData()).get("imagen");
  } catch {
    return json({ error: "No llegó ninguna imagen." }, 400);
  }
  if (!(archivo instanceof File) || archivo.size === 0) return json({ error: "No llegó ninguna imagen." }, 400);

  try {
    return json({ valor: await guardarImagen(archivo) });
  } catch (e) {
    if (e instanceof ErrorImagen) return json({ error: e.message }, 400);
    return json({ error: "No se pudo guardar la imagen." }, 500);
  }
}
