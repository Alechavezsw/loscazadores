import { randomBytes } from "node:crypto";
import { connection } from "next/server";
import { esAdmin } from "@/lib/auth";
import { usaPostgres } from "@/lib/store";
import { borrarVideoEnBd, guardarTrozoVideoEnBd, infoVideoEnBd, iniciarVideoEnBd, terminarVideoEnBd } from "@/lib/store-pg";
import { MAX_VIDEO_BD_BYTES, TIPOS_VIDEO, TROZO_VIDEO_BYTES } from "@/lib/video-limites";
import { EXTENSION, NOMBRE_VIDEO_VALIDO, pareceVideo } from "@/lib/videos";

/**
 * Subida de un video a la base, por trozos: una función de Vercel no recibe pedidos de más de 4,5 MB, así que el
 * panel manda el video en pedazos de TROZO_VIDEO_BYTES. El recorrido es:
 *   1. POST {accion:"iniciar", tipo, bytes}  → devuelve el nombre con el que va a quedar guardado.
 *   2. PUT ?nombre=…&n=0, 1, 2…              → un trozo por pedido, como cuerpo crudo.
 *   3. POST {accion:"terminar", nombre}      → comprueba que estén todos y recién ahí el video se puede ver.
 * Solo sirve para quien está en el panel.
 */

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
}

async function rechazo() {
  if (!(await esAdmin())) return json({ error: "Tenés que entrar al panel para subir videos." }, 401);
  if (!usaPostgres()) return json({ error: "Este sitio no guarda los videos en la base." }, 409);
  return null;
}

export async function POST(req: Request) {
  await connection();
  const no = await rechazo();
  if (no) return no;

  let cuerpo: { accion?: unknown; tipo?: unknown; bytes?: unknown; nombre?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }

  if (cuerpo.accion === "iniciar") {
    const tipo = String(cuerpo.tipo ?? "").toLowerCase();
    const bytes = Number(cuerpo.bytes);
    if (!(TIPOS_VIDEO as readonly string[]).includes(tipo)) return json({ error: "Formato no admitido. Subí un MP4 o un WebM." }, 400);
    if (!Number.isInteger(bytes) || bytes < 1) return json({ error: "El archivo está vacío." }, 400);
    if (bytes > MAX_VIDEO_BD_BYTES) return json({ error: `El video pesa más de ${MAX_VIDEO_BD_BYTES / 1024 / 1024} MB.` }, 413);

    const nombre = `${randomBytes(8).toString("hex")}.${EXTENSION[tipo]}`;
    try {
      await iniciarVideoEnBd(nombre, tipo, bytes);
    } catch (e) {
      console.error("[videos] iniciar:", e instanceof Error ? e.message : e);
      return json({ error: "No se pudo preparar la subida." }, 500);
    }
    return json({ nombre, trozo: TROZO_VIDEO_BYTES });
  }

  if (cuerpo.accion === "terminar") {
    const nombre = String(cuerpo.nombre ?? "");
    if (!NOMBRE_VIDEO_VALIDO.test(nombre)) return json({ error: "Pedido inválido." }, 400);
    try {
      if (!(await terminarVideoEnBd(nombre))) return json({ error: "La subida quedó incompleta. Probá de nuevo." }, 400);
    } catch (e) {
      console.error("[videos] terminar:", e instanceof Error ? e.message : e);
      return json({ error: "No se pudo terminar la subida." }, 500);
    }
    return json({ valor: nombre });
  }

  return json({ error: "Pedido inválido." }, 400);
}

export async function PUT(req: Request) {
  await connection();
  const no = await rechazo();
  if (no) return no;

  const url = new URL(req.url);
  const nombre = url.searchParams.get("nombre") ?? "";
  const n = Number(url.searchParams.get("n"));
  if (!NOMBRE_VIDEO_VALIDO.test(nombre) || !Number.isInteger(n) || n < 0) return json({ error: "Pedido inválido." }, 400);
  if (Number(req.headers.get("content-length") ?? 0) > TROZO_VIDEO_BYTES) return json({ error: "El trozo es demasiado grande." }, 413);

  const info = await infoVideoEnBd(nombre);
  if (!info || info.completo) return json({ error: "Esa subida no existe o ya terminó." }, 409);

  const inicio = n * TROZO_VIDEO_BYTES;
  if (inicio >= info.bytes) return json({ error: "Trozo fuera de rango." }, 400);
  const esperado = Math.min(TROZO_VIDEO_BYTES, info.bytes - inicio);

  const datos = Buffer.from(await req.arrayBuffer());
  if (datos.length !== esperado) return json({ error: "El trozo llegó incompleto. Probá de nuevo." }, 400);

  // Que el archivo diga ser un video no alcanza: se miran los primeros bytes.
  if (n === 0 && !pareceVideo(datos.subarray(0, 12), nombre.split(".").pop()!)) {
    await borrarVideoEnBd(nombre).catch(() => undefined);
    return json({ error: "Ese archivo no parece un video válido." }, 400);
  }

  try {
    await guardarTrozoVideoEnBd(nombre, n, inicio, datos);
  } catch (e) {
    console.error("[videos] trozo:", e instanceof Error ? e.message : e);
    return json({ error: "No se pudo guardar el video." }, 500);
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
