import { cn } from "@/lib/cn";
import type { Anuncio } from "@/lib/types";
import { Photo } from "./Brand";

type Props = {
  anuncio: Anuncio | null;
  /** Link de WhatsApp para consultar por publicidad. */
  consultaHref: string;
  className?: string;
};

/** Invitación a anunciar, acostada: «Publicidad» y «Tu marca acá» en la misma línea. */
function Invitacion() {
  return (
    <>
      <span className="text-xl font-bold uppercase tracking-widest text-white sm:text-2xl">Publicidad</span>
      <span aria-hidden className="h-0.5 w-10 shrink-0 bg-hunter sm:w-16" />
      <span className="text-lg font-bold uppercase tracking-wide text-white/70 sm:text-xl">Tu marca acá</span>
    </>
  );
}

/** Banner horizontal de un lateral. Muestra el anuncio activo o invita a publicar. */
export function AdRail({ anuncio, consultaHref, className }: Props) {
  if (anuncio?.imagen) {
    const imagen = <Photo nombre={anuncio.imagen} alt={anuncio.titulo || "Publicidad"} className="size-full object-cover" />;
    return (
      <aside aria-label="Publicidad" data-anuncio-vista={anuncio.id} className={cn("h-32 overflow-hidden rounded-2xl bg-ink md:h-40", className)}>
        {anuncio.enlace ? (
          <a
            href={anuncio.enlace}
            data-evento="anuncio-clic"
            data-anuncio={anuncio.id}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block size-full transition-opacity duration-700 ease-fluid hover:opacity-90"
          >
            {imagen}
          </a>
        ) : (
          imagen
        )}
      </aside>
    );
  }

  const clases =
    "flex h-28 w-full flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/10 bg-ink-1 px-6 transition-colors duration-700 ease-fluid sm:h-32 sm:gap-6 md:h-36";

  return (
    <aside aria-label="Espacio publicitario" className={className}>
      {consultaHref ? (
        <a href={consultaHref} data-evento="anunciar" target="_blank" rel="noopener noreferrer" className={cn(clases, "hover:bg-ink-3")}>
          <Invitacion />
        </a>
      ) : (
        <div className={clases}>
          <Invitacion />
        </div>
      )}
    </aside>
  );
}
