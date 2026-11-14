import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Handshake, PencilSimple } from "@phosphor-icons/react/ssr";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MedioForm } from "@/components/admin/MedioForm";
import { botonSecundario, Mensaje, tarjeta, TituloPagina } from "@/components/admin/ui";
import { Photo } from "@/components/site/Brand";
import { requerirAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { alternarMedio, eliminarMedio, moverMedio } from "../../actions";

export const metadata: Metadata = { title: "Medios amigos" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

const AVISOS: Record<string, string> = {
  guardado: "Medio actualizado.",
};

export default async function MediosAmigos({ searchParams }: PageProps<"/semiton/medios-amigos">) {
  await requerirAdmin();
  const { msg } = await searchParams;
  const aviso = typeof msg === "string" ? AVISOS[msg] : undefined;
  const { mediosAmigos } = await readDb();

  return (
    <>
      <TituloPagina
        titulo="Medios amigos"
        bajada="Los logos de los medios aliados que se ven en la portada y en la sección «Medios amigos». Se muestran en el orden de esta lista."
      />

      {aviso ? (
        <div className="mb-6">
          <Mensaje ok>{aviso}</Mensaje>
        </div>
      ) : null}

      <div className="flex flex-col gap-10">
        <section aria-labelledby="nuevo">
          <h2 id="nuevo" className="mb-4 text-xl font-bold tracking-tight">
            Nuevo medio
          </h2>
          <MedioForm />
        </section>

        {mediosAmigos.length === 0 ? (
          <div className={`${tarjeta} flex flex-col items-center gap-3 py-12 text-center`}>
            <Handshake className="size-10 text-ink/30" aria-hidden />
            <p className="text-xl font-bold">Todavía no hay medios amigos</p>
            <p className="max-w-md text-base text-ink/70">Cuando cargues el primero, aparece acá y se muestra en el sitio.</p>
          </div>
        ) : (
          <section aria-labelledby="lista">
            <h2 id="lista" className="mb-4 text-xl font-bold tracking-tight">
              Medios cargados
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mediosAmigos.map((m, i) => (
                <li key={m.id} className={`${tarjeta} flex flex-col gap-3 p-4`}>
                  <Link
                    href={`/semiton/medios-amigos/${m.id}`}
                    aria-label={`Editar ${m.nombre}`}
                    className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-lg bg-white p-3 ring-1 ring-line"
                  >
                    {m.logo ? (
                      <Photo nombre={m.logo} alt="" className="object-contain" />
                    ) : (
                      <span className="text-center text-sm font-extrabold uppercase leading-tight tracking-tight">{m.nombre}</span>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{m.nombre}</p>
                    <p className="truncate text-xs text-ink/60">{m.tipo}</p>
                    <p className="truncate text-xs text-ink/60">{m.enlace || "Sin enlace"}</p>
                    <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${m.activo ? "text-[#0f6b35]" : "text-ink/50"}`}>
                      {m.activo ? "Activo" : "Pausado"}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    <Link href={`/semiton/medios-amigos/${m.id}`} className={`${botonSecundario} px-3 py-1 text-sm`}>
                      <PencilSimple className="size-4" aria-hidden />
                      Editar
                    </Link>
                    <form action={alternarMedio.bind(null, m.id)}>
                      <button type="submit" className={`${botonSecundario} px-3 py-1 text-sm`}>
                        {m.activo ? "Pausar" : "Activar"}
                      </button>
                    </form>
                    <form action={moverMedio.bind(null, m.id, "arriba")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label={`Subir ${m.nombre} un lugar`}
                        className={`${botonSecundario} px-2 py-1 text-sm`}
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                    </form>
                    <form action={moverMedio.bind(null, m.id, "abajo")}>
                      <button
                        type="submit"
                        disabled={i === mediosAmigos.length - 1}
                        aria-label={`Bajar ${m.nombre} un lugar`}
                        className={`${botonSecundario} px-2 py-1 text-sm`}
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </button>
                    </form>
                    <form action={eliminarMedio.bind(null, m.id)}>
                      <ConfirmButton chico />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
