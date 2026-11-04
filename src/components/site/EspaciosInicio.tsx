import Link from "next/link";
import { ArrowRight, Megaphone, Storefront } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";
import { ESPACIO_INFO, ESPACIOS, type Espacio, type Noticia } from "@/lib/types";
import { SectionTitle } from "./Brand";
import { NewsCard } from "./NewsCard";

const ICONO = { "viva-feria": Storefront, "si-san-juan": Megaphone } as const;

/** Cada espacio lleva su propia cabecera: Viva Feria en rojo y Servicios en negro, para distinguirlos de un vistazo. */
const CABECERA: Record<Espacio, string> = {
  "viva-feria": "bg-hunter",
  "si-san-juan": "bg-ink",
};

/** Un espacio propio de la portada: una cabecera de color y sus últimas noticias. */
function EspacioCard({ espacio, noticias }: { espacio: Espacio; noticias: Noticia[] }) {
  const info = ESPACIO_INFO[espacio];
  const Icono = ICONO[espacio];
  const [ultima, ...otras] = noticias;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={info.ruta} className={cn("trama group flex items-center gap-4 p-4 text-white md:p-6", CABECERA[espacio])}>
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Icono weight="fill" className="size-8" />
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-2xl font-bold uppercase tracking-wide md:text-3xl">{info.nombre}</span>
          <span className="mt-1 block text-sm font-medium text-white/85">{info.subtitulo}</span>
        </span>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-all duration-700 ease-fluid group-hover:bg-white group-hover:text-ink"
        >
          <ArrowRight weight="bold" className="size-5 transition-transform duration-700 ease-fluid group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {ultima ? (
          <>
            <NewsCard n={ultima} />
            {otras.slice(0, 2).map((n) => (
              // El contenedor evita que la fila se estire hasta llenar la columna.
              <div key={n.id}>
                <NewsCard n={n} variante="fila" />
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded border border-dashed border-line p-8 text-center">
            <Icono className="size-8 text-ink/30" aria-hidden />
            <p className="text-sm font-semibold">Todavía no hay novedades publicadas</p>
            <p className="text-xs text-ink/60">{info.vacio}</p>
          </div>
        )}

        <Link
          href={info.ruta}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter active:scale-[0.98]"
        >
          Ver todas las novedades
          <ArrowRight weight="bold" className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/** Viva Feria y Servicios, lado a lado. Cada uno muestra sus noticias más recientes. */
export function EspaciosInicio({ noticias }: { noticias: Noticia[] }) {
  return (
    <section aria-labelledby="espacios-titulo" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
      <Reveal>
        <SectionTitle id="espacios-titulo" eyebrow="Espacios">
          {ESPACIOS.map((e) => ESPACIO_INFO[e].nombre).join(" y ")}
        </SectionTitle>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {ESPACIOS.map((e, i) => (
          <Reveal key={e} delay={i * 0.1} className="h-full">
            <EspacioCard espacio={e} noticias={noticias.filter((n) => n.espacio === e).slice(0, 3)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
