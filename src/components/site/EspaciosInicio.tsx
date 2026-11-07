import Link from "next/link";
import { ArrowRight, CalendarStar, EnvelopeSimple, EyeSlash, HandHeart, Handshake } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";
import { notaEnSeccion, rutaSeccion, seccionPorSlug, type Noticia } from "@/lib/types";
import { SectionTitle } from "./Brand";
import { MediosAmigos } from "./MediosAmigos";
import { NewsCard } from "./NewsCard";

/**
 * Cómo se ve la tarjeta de cada sección del bloque. El nombre, el texto y el enlace salen de la sección (types.ts).
 * Las tarjetas van de a dos por fila: la de la izquierda en rojo y la de la derecha en negro, para distinguirlas
 * de un vistazo. `exclusiva` es para las secciones nuevas cuyas notas no se repiten en las últimas noticias; las
 * de una categoría general (Eventos) sí aparecen también ahí.
 */
const PRESENTACION: { slug: string; Icono: typeof EyeSlash; cabecera: string; exclusiva?: boolean }[] = [
  { slug: "tapa-mi-numero", Icono: EyeSlash, cabecera: "bg-hunter", exclusiva: true },
  { slug: "cartas-de-la-vieja-pocha", Icono: EnvelopeSimple, cabecera: "bg-ink", exclusiva: true },
  { slug: "eventos", Icono: CalendarStar, cabecera: "bg-hunter" },
  { slug: "medios-amigos", Icono: Handshake, cabecera: "bg-ink" },
  { slug: "solidario", Icono: HandHeart, cabecera: "bg-hunter", exclusiva: true },
];

const TARJETAS = PRESENTACION.flatMap((p) => {
  const seccion = seccionPorSlug(p.slug);
  return seccion ? [{ ...p, seccion }] : [];
});

type Tarjeta = (typeof TARJETAS)[number];

/** Las notas que van en una tarjeta propia de este bloque: no se repiten en las últimas noticias. */
export const estaEnComunidad = (n: Noticia) => TARJETAS.some((t) => t.exclusiva && notaEnSeccion(n, t.seccion));

/**
 * `ancha`: la tarjeta ocupa las dos columnas (es la que quedaría sola en la última fila) y reparte sus notas como
 * «Últimas noticias»: una grande a la izquierda y dos apiladas a la derecha.
 */
function EspacioCard({
  tarjeta,
  noticias,
  radioEnlace,
  ancha,
}: {
  tarjeta: Tarjeta;
  noticias: Noticia[];
  radioEnlace: string;
  ancha: boolean;
}) {
  const { Icono, seccion } = tarjeta;
  const ruta = rutaSeccion(seccion);
  const [ultima, ...otras] = noticias;
  const deMedios = seccion.tipo === "medios";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={ruta} className={cn("trama group flex items-center gap-4 p-4 text-white md:p-6", tarjeta.cabecera)}>
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Icono weight="fill" className="size-8" />
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-2xl font-bold uppercase tracking-wide md:text-3xl">{seccion.nombre}</span>
          <span className="mt-1 block text-sm font-medium text-white/85">{seccion.bajada}</span>
        </span>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-all duration-700 ease-fluid group-hover:bg-white group-hover:text-ink"
        >
          <ArrowRight weight="bold" className="size-5 transition-transform duration-700 ease-fluid group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {deMedios ? (
          <MediosAmigos radioEnlace={radioEnlace} />
        ) : ultima && ancha ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <NewsCard n={ultima} />
            <div className="flex flex-col gap-4">
              {otras.slice(0, 2).map((n) => (
                <div key={n.id}>
                  <NewsCard n={n} variante="fila" />
                </div>
              ))}
            </div>
          </div>
        ) : ultima ? (
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
            <p className="text-xs text-ink/60">Cuando se publique algo de esta sección, lo vas a ver acá.</p>
          </div>
        )}

        <Link
          href={ruta}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter active:scale-[0.98]"
        >
          {deMedios ? "Ver todos los medios" : "Ver todas las novedades"}
          <ArrowRight weight="bold" className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/**
 * El bloque «Comunidad»: las secciones de PRESENTACION, de a dos por fila (la última se estira si queda sola). Cada
 * una muestra sus notas más recientes (las de su categoría); la de medios amigos muestra logos con enlaces.
 * `radioEnlace` es el enlace de la radio de Ajustes.
 */
export function EspaciosInicio({ noticias, radioEnlace }: { noticias: Noticia[]; radioEnlace: string }) {
  return (
    <section aria-labelledby="espacios-titulo" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
      <Reveal>
        <SectionTitle id="espacios-titulo" eyebrow="Secciones">Comunidad</SectionTitle>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {TARJETAS.map((t, i) => {
          // Con un número impar de tarjetas, la última se estira para no dejar un hueco al lado.
          const ancha = TARJETAS.length % 2 === 1 && i === TARJETAS.length - 1;
          return (
            <Reveal key={t.slug} delay={(i % 2) * 0.1} className={cn("h-full", ancha && "lg:col-span-2")}>
              <EspacioCard
                tarjeta={t}
                noticias={noticias.filter((n) => notaEnSeccion(n, t.seccion)).slice(0, 3)}
                radioEnlace={radioEnlace}
                ancha={ancha}
              />
            </Reveal>
          );
        })}
      </div>
      </div>
    </section>
  );
}
