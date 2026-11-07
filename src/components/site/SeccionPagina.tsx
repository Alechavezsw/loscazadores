import Link from "next/link";
import { Newspaper } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";
import { getNoticias } from "@/lib/queries";
import { rutaSeccion, SECCIONES, type Seccion } from "@/lib/types";
import { NewsCard } from "./NewsCard";
import { PageHeader } from "./PageHeader";

/**
 * Página de una sección del sitio (Servicios Sociales, Comunidad, Solidario, Eventos, Carta Abierta, Entrevista):
 * todas las notas de esa categoría, de la más nueva a la más vieja, y los enlaces a las demás secciones.
 */
export async function SeccionPagina({ seccion }: { seccion: Seccion }) {
  const noticias = (await getNoticias()).filter((n) => n.categoria === seccion.nombre);

  return (
    <>
      <PageHeader etiqueta="Sección" titulo={seccion.nombre} bajada={seccion.bajada} />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-6 md:py-16">
        <nav aria-label="Secciones" className="mb-8 flex flex-wrap items-center gap-2">
          {SECCIONES.map((s) => {
            const activa = s.slug === seccion.slug;
            return (
              <Link
                key={s.slug}
                href={rutaSeccion(s)}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
                  activa ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
                )}
              >
                {s.nombre}
              </Link>
            );
          })}
        </nav>

        {noticias.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {noticias.map((n, i) => (
              <li key={n.id} className="h-full">
                <Reveal delay={(i % 4) * 0.1} className="h-full">
                  <NewsCard n={n} />
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <Newspaper className="size-10 text-ink/30" aria-hidden />
            <p className="text-xl font-bold">Todavía no hay notas en {seccion.nombre}</p>
            <p className="max-w-md text-base text-ink/70">Cuando se publique algo de esta sección, lo vas a ver acá.</p>
            <Link
              href="/noticias"
              className="mt-2 rounded-full bg-ink px-6 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter active:scale-[0.98]"
            >
              Ver todas las noticias
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
