import { Plus } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import type { Anuncio } from "@/lib/types";
import { Photo, SectionTitle } from "./Brand";

export function Promos({ anuncios, consultaHref }: { anuncios: Anuncio[]; consultaHref: string }) {
  const promos = anuncios.filter((a) => a.slot === "promo" && a.imagen).slice(0, 8);
  // Siempre hay al menos 4 lugares a la vista: los libres invitan a anunciar.
  const libres = Math.max(0, 4 - promos.length);

  return (
    <section aria-labelledby="promos-titulo" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
      <Reveal>
        <SectionTitle id="promos-titulo" eyebrow="Publicidad">Promociones</SectionTitle>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {promos.map((a, i) => {
          const imagen = <Photo nombre={a.imagen!} alt={a.titulo || "Promoción"} className="transition-transform duration-700 ease-fluid group-hover:scale-105" />;
          return (
            <Reveal key={a.id} delay={(i % 4) * 0.08} className="h-full">
              <div data-anuncio-vista={a.id} className="group aspect-[4/3] overflow-hidden rounded-2xl bg-ink-3">
                {a.enlace ? (
                  <a
                    href={a.enlace}
                    data-evento="anuncio-clic"
                    data-anuncio={a.id}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block size-full"
                    aria-label={a.titulo || "Ver promoción"}
                  >
                    {imagen}
                  </a>
                ) : (
                  imagen
                )}
              </div>
            </Reveal>
          );
        })}

        {Array.from({ length: libres }).map((_, i) => {
          const interior = (
            <>
              <span
                aria-hidden
                className="flex size-14 items-center justify-center rounded-full bg-hunter text-white transition-transform duration-700 ease-fluid group-hover:scale-110"
              >
                <Plus weight="bold" className="size-7" />
              </span>
              <span className="text-center text-xl font-bold uppercase leading-tight text-white md:text-2xl">
                Tu promoción
                <br />
                acá
              </span>
              {consultaHref ? <span className="text-sm font-medium text-white/60">Consultá por WhatsApp</span> : null}
            </>
          );
          const clases =
            "group trama flex aspect-[4/3] size-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/25 bg-ink-1 p-4 transition-all duration-700 ease-fluid";
          return (
            <Reveal key={`libre-${i}`} delay={((promos.length + i) % 4) * 0.08} className="h-full">
              {consultaHref ? (
                <a href={consultaHref} data-evento="anunciar" target="_blank" rel="noopener noreferrer" className={`${clases} hover:-translate-y-2 hover:border-hunter hover:bg-ink-3`}>
                  {interior}
                </a>
              ) : (
                <div className={clases}>{interior}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
