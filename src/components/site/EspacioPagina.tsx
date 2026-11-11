import { Newspaper } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { getNoticias } from "@/lib/queries";
import { ldListado, ldMigas } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { ESPACIO_INFO, type Espacio } from "@/lib/types";
import { JsonLd } from "./JsonLd";
import { NewsCard } from "./NewsCard";
import { PageHeader } from "./PageHeader";

/** Página de un espacio (hoy, Servicios): todas sus noticias, de la más nueva a la más vieja. */
export async function EspacioPagina({ espacio }: { espacio: Espacio }) {
  const info = ESPACIO_INFO[espacio];
  const noticias = (await getNoticias()).filter((n) => n.espacio === espacio);
  const sitio = urlSitio();

  return (
    <>
      <JsonLd
        datos={ldListado(sitio, {
          nombre: info.nombre,
          descripcion: info.bajada,
          ruta: info.ruta,
          items: noticias.map((n) => ({ nombre: n.titulo, ruta: `/noticias/${n.slug}` })),
        })}
      />
      <JsonLd datos={ldMigas(sitio, [{ nombre: info.nombre, ruta: info.ruta }])} />
      <PageHeader etiqueta={info.subtitulo} titulo={info.nombre} bajada={info.bajada} />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-6 md:py-16">
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
            <p className="text-xl font-bold">Todavía no hay novedades publicadas</p>
            <p className="max-w-md text-base text-ink/70">{info.vacio}</p>
          </div>
        )}
      </div>
    </>
  );
}
