import Link from "next/link";
import type { Noticia } from "@/lib/types";

/** Cinta de titulares. Prioriza lo urgente y se completa con lo último publicado. */
export function Ticker({ noticias }: { noticias: Noticia[] }) {
  const urgentes = noticias.filter((n) => n.urgente);
  const resto = noticias.filter((n) => !n.urgente);
  const items = [...urgentes, ...resto].slice(0, 8);
  if (items.length === 0) return null;

  const etiqueta = urgentes.length > 0 ? "Última hora" : "Lo último";

  const lista = (oculta: boolean) => (
    <ul aria-hidden={oculta || undefined} className="flex shrink-0 items-center">
      {items.map((n) => (
        <li key={n.id} className="flex items-center">
          <Link
            href={`/noticias/${n.slug}`}
            tabIndex={oculta ? -1 : undefined}
            className="whitespace-nowrap px-6 text-sm font-semibold transition-opacity duration-700 ease-fluid hover:opacity-70"
          >
            {n.titulo}
          </Link>
          <span aria-hidden className="size-1 rounded-full bg-white/60" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={etiqueta} className="flex items-stretch overflow-hidden bg-hunter text-white">
      <div className="relative z-10 flex shrink-0 items-center gap-2 bg-ink px-4 py-3 text-xs font-bold uppercase tracking-widest md:px-6">
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
          <span className="relative size-2 rounded-full bg-hunter" />
        </span>
        {etiqueta}
      </div>
      <div className="group relative flex-1 overflow-hidden">
        <div className="ticker-track flex w-max animate-marquee py-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {lista(false)}
          {lista(true)}
        </div>
      </div>
    </section>
  );
}
