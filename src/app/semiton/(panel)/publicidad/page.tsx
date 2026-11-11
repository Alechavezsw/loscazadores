import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, PencilSimple } from "@phosphor-icons/react/ssr";
import { AdForm } from "@/components/admin/AdForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { botonSecundario, Mensaje, tarjeta, TituloPagina } from "@/components/admin/ui";
import { Photo } from "@/components/site/Brand";
import { cn } from "@/lib/cn";
import { requerirAdmin } from "@/lib/auth";
import { leerPanel } from "@/lib/stats";
import { readDb } from "@/lib/store";
import { marcoAnuncio, SLOT_NOMBRE, SLOTS } from "@/lib/types";
import { alternarAnuncio, eliminarAnuncio } from "../../actions";

export const metadata: Metadata = { title: "Publicidad" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

const AVISOS: Record<string, string> = {
  guardado: "Anuncio actualizado.",
};

export default async function Publicidad({ searchParams }: PageProps<"/semiton/publicidad">) {
  await requerirAdmin();
  const { msg } = await searchParams;
  const aviso = typeof msg === "string" ? AVISOS[msg] : undefined;
  const [{ anuncios }, panel] = await Promise.all([readDb(), leerPanel(30)]);
  const medidos = new Map(panel.anuncios.map((a) => [a.id, a]));
  const numero = new Intl.NumberFormat("es-AR");

  return (
    <>
      <TituloPagina
        titulo="Publicidad"
        bajada="Los banners horizontales y la grilla de promociones. Los espacios libres muestran una invitación a anunciar."
      />

      {aviso ? (
        <div className="mb-6">
          <Mensaje ok>{aviso}</Mensaje>
        </div>
      ) : null}

      <div className="flex flex-col gap-10">
        <section aria-labelledby="nuevo">
          <h2 id="nuevo" className="mb-4 text-xl font-bold tracking-tight">
            Nuevo anuncio
          </h2>
          <AdForm />
        </section>

        {anuncios.length === 0 ? (
          <div className={`${tarjeta} flex flex-col items-center gap-3 py-12 text-center`}>
            <Megaphone className="size-10 text-ink/30" aria-hidden />
            <p className="text-xl font-bold">Todavía no hay anuncios</p>
            <p className="max-w-md text-base text-ink/70">Cuando cargues el primero, aparece acá y se muestra en el sitio.</p>
          </div>
        ) : (
          SLOTS.map((slot) => {
            const delSlot = anuncios.filter((a) => a.slot === slot);
            if (delSlot.length === 0) return null;
            return (
              <section key={slot} aria-labelledby={`slot-${slot}`}>
                <h2 id={`slot-${slot}`} className="text-xl font-bold tracking-tight">
                  {SLOT_NOMBRE[slot]}
                </h2>
                {slot === "banner" || slot === "banner-2" ? (
                  <p className="mb-4 text-sm text-ink/60">
                    Se muestra el primer anuncio activo,{" "}
                    {slot === "banner" ? "arriba de «Lo último en nuestras redes»." : "debajo del bloque «Comunidad»."}
                  </p>
                ) : slot === "lateral-der" ? (
                  <p className="mb-4 text-sm text-ink/60">Se muestra el primer anuncio activo, en horizontal, arriba de «Secciones».</p>
                ) : slot === "lateral-izq" ? (
                  <p className="mb-4 text-sm text-ink/60">Este lugar ya no aparece en la portada.</p>
                ) : (
                  <p className="mb-4 text-sm text-ink/60">Se muestran hasta 8 anuncios activos en la grilla.</p>
                )}
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {delSlot.map((a) => (
                    <li key={a.id} className={`${tarjeta} flex flex-col gap-3 p-4`}>
                      <Link href={`/semiton/publicidad/${a.id}`} aria-label={`Editar la foto de ${a.titulo || "este anuncio"}`} className={cn("block overflow-hidden rounded-lg bg-ink-1", marcoAnuncio(slot).aspecto)}>
                        {a.imagen ? <Photo nombre={a.imagen} alt="" className={marcoAnuncio(slot).ajuste === "contain" ? "object-contain" : ""} /> : null}
                      </Link>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{a.titulo || "Sin nombre"}</p>
                        <p className="truncate text-xs text-ink/60">{a.enlace || "Sin enlace"}</p>
                        <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${a.activo ? "text-[#0f6b35]" : "text-ink/50"}`}>
                          {a.activo ? "Activo" : "Pausado"}
                        </p>
                        {(() => {
                          const m = medidos.get(a.id);
                          const vistas = m?.vistas ?? 0;
                          const clics = m?.clics ?? 0;
                          return (
                            <p className="mt-1 text-xs text-ink/60">
                              Últimos 30 días: {numero.format(vistas)} {vistas === 1 ? "vista" : "vistas"} · {numero.format(clics)} {clics === 1 ? "clic" : "clics"}
                              {vistas > 0 ? ` (${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format((clics / vistas) * 100)} %)` : ""}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Link href={`/semiton/publicidad/${a.id}`} className={`${botonSecundario} px-3 py-1 text-sm`}>
                          <PencilSimple className="size-4" aria-hidden />
                          Editar
                        </Link>
                        <form action={alternarAnuncio.bind(null, a.id)}>
                          <button type="submit" className={`${botonSecundario} px-3 py-1 text-sm`}>
                            {a.activo ? "Pausar" : "Activar"}
                          </button>
                        </form>
                        <form action={eliminarAnuncio.bind(null, a.id)}>
                          <ConfirmButton chico />
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
