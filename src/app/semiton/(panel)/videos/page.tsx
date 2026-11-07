import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeSlash, PencilSimple, Play, Plus } from "@phosphor-icons/react/ssr";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { botonPrimario, botonSecundario, Mensaje, tarjeta, TituloPagina } from "@/components/admin/ui";
import { VideoPortada } from "@/components/site/VideoPortada";
import { requerirAdmin } from "@/lib/auth";
import { fechaBreve } from "@/lib/format";
import { readDb } from "@/lib/store";
import { alternarPieza, eliminarPieza } from "../../actions";

export const metadata: Metadata = { title: "Videos" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

const AVISOS: Record<string, string> = {
  creada: "Video publicado.",
  guardada: "Cambios guardados.",
  eliminada: "Video eliminado.",
};

export default async function ListaVideos({ searchParams }: PageProps<"/semiton/videos">) {
  await requerirAdmin();
  const { msg } = await searchParams;
  const aviso = typeof msg === "string" ? AVISOS[msg] : undefined;
  const { sinCensura, ajustes } = await readDb();
  const ordenadas = [...sinCensura].sort((a, b) => b.creada.localeCompare(a.creada));

  return (
    <>
      <TituloPagina titulo="Videos" bajada={`Los videos de la sección «${ajustes.nombreVideos}». El nombre se cambia desde Ajustes.`}>
        <Link href="/semiton/videos/nuevo" className={botonPrimario}>
          <Plus weight="bold" className="size-5" aria-hidden />
          Nuevo video
        </Link>
      </TituloPagina>

      {aviso ? (
        <div className="mb-6">
          <Mensaje ok>{aviso}</Mensaje>
        </div>
      ) : null}

      {ordenadas.length === 0 ? (
        <div className={`${tarjeta} flex flex-col items-center gap-3 py-16 text-center`}>
          <Play weight="fill" className="size-10 text-ink/30" aria-hidden />
          <p className="text-xl font-bold">Todavía no cargaste ningún video</p>
          <p className="max-w-md text-base text-ink/70">Cargá el primero y va a aparecer en la sección y en la portada.</p>
          <Link href="/semiton/videos/nuevo" className={`${botonPrimario} mt-2`}>
            Cargar el primero
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenadas.map((p) => (
            <li key={p.id} className={`${tarjeta} flex flex-col gap-4 p-4 md:flex-row md:items-center`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-ink-1">
                  <VideoPortada p={p} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        p.publicada ? "bg-wa/15 text-[#0f6b35]" : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {p.publicada ? "Publicado" : "Borrador"}
                    </span>
                    {p.tipo !== "video" ? (
                      <span className="rounded-full bg-hunter/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-hunter-dark">
                        Nota: no se muestra
                      </span>
                    ) : null}
                    {p.destacada ? <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Principal</span> : null}
                    {p.ejemplo ? <span className="rounded-full border border-line px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink/60">Ejemplo</span> : null}
                  </div>
                  <p className="mt-1 truncate text-base font-semibold">{p.titulo}</p>
                  <p className="text-xs text-ink/60">{fechaBreve(p.creada)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/semiton/videos/${p.id}`} className={`${botonSecundario} px-3 py-1 text-sm`}>
                  <PencilSimple className="size-4" aria-hidden />
                  Editar
                </Link>
                <form action={alternarPieza.bind(null, p.id)}>
                  <button type="submit" className={`${botonSecundario} px-3 py-1 text-sm`}>
                    {p.publicada ? <EyeSlash className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    {p.publicada ? "Pasar a borrador" : "Publicar"}
                  </button>
                </form>
                <form action={eliminarPieza.bind(null, p.id)}>
                  <ConfirmButton chico />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
