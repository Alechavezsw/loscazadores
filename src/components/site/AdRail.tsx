import { cn } from "@/lib/cn";
import type { Anuncio } from "@/lib/types";
import { Photo } from "./Brand";

type Props = {
  anuncio: Anuncio | null;
  /** Link de WhatsApp para consultar por publicidad. */
  consultaHref: string;
  className?: string;
};

/** Franja vertical de publicidad a los costados de las columnas. */
export function AdRail({ anuncio, consultaHref, className }: Props) {
  if (anuncio?.imagen) {
    const imagen = <Photo nombre={anuncio.imagen} alt={anuncio.titulo || "Publicidad"} />;
    return (
      <aside aria-label="Publicidad" data-anuncio-vista={anuncio.id} className={cn("overflow-hidden rounded-2xl bg-ink", className)}>
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

  const contenido = (
    <>
      <span className="[writing-mode:vertical-rl] rotate-180 text-2xl font-bold uppercase tracking-widest text-white">
        Publicidad
      </span>
      <span aria-hidden className="h-0.5 w-10 bg-hunter" />
      <span className="[writing-mode:vertical-rl] rotate-180 text-xl font-bold uppercase tracking-wide text-white/70">
        Tu marca acá
      </span>
    </>
  );

  return (
    <aside aria-label="Espacio publicitario" className={cn("overflow-hidden rounded-2xl bg-ink-1", className)}>
      {consultaHref ? (
        <a
          href={consultaHref}
          data-evento="anunciar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-full min-h-72 flex-col items-center justify-center gap-6 border border-white/10 transition-colors duration-700 ease-fluid hover:bg-ink-3"
        >
          {contenido}
        </a>
      ) : (
        <div className="flex size-full min-h-72 flex-col items-center justify-center gap-6 border border-white/10">
          {contenido}
        </div>
      )}
    </aside>
  );
}
