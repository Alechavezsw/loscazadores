import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeSlash, Newspaper, PencilSimple, Plus } from "@phosphor-icons/react/ssr";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { botonPrimario, botonSecundario, Mensaje, tarjeta, TituloPagina } from "@/components/admin/ui";
import { Photo } from "@/components/site/Brand";
import { CANAL_UI } from "@/components/site/canales";
import { requerirAdmin } from "@/lib/auth";
import { tieneVideo } from "@/lib/embeds";
import { ESPACIO_INFO } from "@/lib/types";
import { fechaBreve } from "@/lib/format";
import { readDb } from "@/lib/store";
import { alternarPublicada, eliminarNoticia } from "../../actions";

export const metadata: Metadata = { title: "Noticias" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;


const AVISOS: Record<string, string> = {
  creada: "Noticia publicada.",
  guardada: "Cambios guardados.",
  eliminada: "Noticia eliminada.",
  ejemplos: "Contenido de ejemplo eliminado.",
};

export default async function ListaNoticias({ searchParams }: PageProps<"/admin/noticias">) {
  await requerirAdmin();
  const { msg } = await searchParams;
  const aviso = typeof msg === "string" ? AVISOS[msg] : undefined;
  const { noticias } = await readDb();
  const ordenadas = [...noticias].sort((a, b) => b.creada.localeCompare(a.creada));

  return (
    <>
      <TituloPagina titulo="Noticias" bajada="Todo lo que cargaste, publicado o en borrador.">
        <Link href="/admin/noticias/nueva" className={botonPrimario}>
          <Plus weight="bold" className="size-5" aria-hidden />
          Nueva noticia
        </Link>
      </TituloPagina>

      {aviso ? (
        <div className="mb-6">
          <Mensaje ok>{aviso}</Mensaje>
        </div>
      ) : null}

      {ordenadas.length === 0 ? (
        <div className={`${tarjeta} flex flex-col items-center gap-3 py-16 text-center`}>
          <Newspaper className="size-10 text-ink/30" aria-hidden />
          <p className="text-xl font-bold">Todavía no cargaste ninguna noticia</p>
          <p className="max-w-md text-base text-ink/70">Cargá la primera y va a aparecer en la portada y en la columna de cada red que marques.</p>
          <Link href="/admin/noticias/nueva" className={`${botonPrimario} mt-2`}>
            Cargar la primera
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenadas.map((n) => (
            <li key={n.id} className={`${tarjeta} flex flex-col gap-4 p-4 md:flex-row md:items-center`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-ink-1">
                  {n.imagen ? <Photo nombre={n.imagen} alt="" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        n.publicada ? "bg-wa/15 text-[#0f6b35]" : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {n.publicada ? "Publicada" : "Borrador"}
                    </span>
                    {n.urgente ? <span className="rounded-full bg-hunter px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Última hora</span> : null}
                    {tieneVideo(n) ? <span className="rounded-full bg-fb/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#0b4fb3]">Video</span> : null}
                    {n.destacada ? <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Destacada</span> : null}
                    {n.espacio ? <span className="rounded-full bg-hunter/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-hunter-dark">{ESPACIO_INFO[n.espacio].nombre}</span> : null}
                    {n.ejemplo ? <span className="rounded-full border border-line px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink/60">Ejemplo</span> : null}
                  </div>
                  <p className="mt-1 truncate text-base font-semibold">{n.titulo}</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
                    <span>{n.categoria}</span>
                    <span>{fechaBreve(n.creada)}</span>
                    {n.canales.length > 0 ? (
                      <span className="flex items-center gap-1" aria-label={`Redes: ${n.canales.map((c) => CANAL_UI[c].corto).join(", ")}`}>
                        {n.canales.map((c) => {
                          const Icono = CANAL_UI[c].Icono;
                          return <Icono key={c} weight="fill" className="size-4" aria-hidden />;
                        })}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/noticias/${n.id}`} className={`${botonSecundario} px-3 py-1 text-sm`}>
                  <PencilSimple className="size-4" aria-hidden />
                  Editar
                </Link>
                <form action={alternarPublicada.bind(null, n.id)}>
                  <button type="submit" className={`${botonSecundario} px-3 py-1 text-sm`}>
                    {n.publicada ? <EyeSlash className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    {n.publicada ? "Pasar a borrador" : "Publicar"}
                  </button>
                </form>
                <form action={eliminarNoticia.bind(null, n.id)}>
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
