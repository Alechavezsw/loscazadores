import { Plus } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";
import type { Anuncio } from "@/lib/types";
import { Photo } from "./Brand";

/** 970 por 250: el tamaño de banner «billboard» que ya conocen los anunciantes. Se achica parejo en el celular. */
const PROPORCION = "aspect-[97/25]";

type Props = {
  anuncio: Anuncio | null;
  /** Link de WhatsApp para consultar por publicidad. */
  consultaHref: string;
  /** El aire que necesita según lo que tenga arriba y abajo (cada sección de la portada trae su propio relleno). */
  className?: string;
};

/** Banner horizontal de publicidad. Muestra el primer anuncio activo del lugar; si no hay, invita a anunciar. */
export function BannerPublicidad({ anuncio, consultaHref, className }: Props) {
  const conImagen = anuncio?.imagen ? anuncio : null;

  const interior = (
    <>
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hunter text-white md:size-10">
        <Plus weight="bold" className="size-4 md:size-5" />
      </span>
      <span className="text-sm font-bold uppercase leading-tight text-white sm:text-lg md:text-2xl">Tu publicidad acá</span>
      {consultaHref ? <span className="hidden text-sm font-medium text-white/60 sm:inline">Consultá por WhatsApp</span> : null}
    </>
  );
  const clasesLibre = cn(
    PROPORCION,
    "trama group flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/25 bg-ink-1 px-4 transition-all duration-700 ease-fluid",
  );

  return (
    <section aria-label="Publicidad" className={cn("mx-auto w-full max-w-[1018px] px-4 md:px-6", className)}>
      <Reveal>
        <p className="mb-2 text-right text-[11px] font-bold uppercase tracking-widest text-ink/50">Publicidad</p>

        {conImagen ? (
          <div data-anuncio-vista={conImagen.id} className={cn(PROPORCION, "overflow-hidden rounded-2xl bg-ink")}>
            {conImagen.enlace ? (
              <a
                href={conImagen.enlace}
                data-evento="anuncio-clic"
                data-anuncio={conImagen.id}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={conImagen.titulo || "Ver publicidad"}
                className="block size-full transition-opacity duration-700 ease-fluid hover:opacity-90"
              >
                <Photo nombre={conImagen.imagen!} alt={conImagen.titulo || "Publicidad"} />
              </a>
            ) : (
              <Photo nombre={conImagen.imagen!} alt={conImagen.titulo || "Publicidad"} />
            )}
          </div>
        ) : consultaHref ? (
          <a
            href={consultaHref}
            data-evento="anunciar"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(clasesLibre, "hover:border-hunter hover:bg-ink-3")}
          >
            {interior}
          </a>
        ) : (
          <div className={clasesLibre}>{interior}</div>
        )}
      </Reveal>
    </section>
  );
}
