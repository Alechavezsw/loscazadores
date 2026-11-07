import { Newspaper } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";
import type { Noticia } from "@/lib/types";
import { SectionTitle } from "./Brand";
import { ClimaCard } from "./ClimaCard";
import { NewsCard } from "./NewsCard";

/** La nota de ejemplo de clima deja su lugar al tiempo real. */
function esClimaDeEjemplo(n: Noticia) {
  return n.ejemplo && n.categoria === "Clima";
}

export function LatestNews({ noticias }: { noticias: Noticia[] }) {
  const lista = noticias.filter((n) => !esClimaDeEjemplo(n));
  const destacada = lista.find((n) => n.destacada) ?? lista[0];
  const resto = lista.filter((n) => n.id !== destacada?.id);
  const laterales = resto.slice(0, 2);
  const abajo = resto.slice(2, 5);

  return (
    <section aria-labelledby="ultimas-titulo" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
      <Reveal>
        <SectionTitle id="ultimas-titulo" eyebrow="Lo que pasa en tu barrio" action={{ href: "/noticias", label: "Ver todas las noticias" }}>
          Últimas noticias
        </SectionTitle>
      </Reveal>

      {destacada ? (
        <div className="mt-10 flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Reveal className="h-full">
              <NewsCard n={destacada} variante="destacada" />
            </Reveal>
            <div className="grid gap-4">
              {laterales.map((n, i) => (
                <Reveal key={n.id} delay={0.1 + i * 0.1} className="h-full">
                  <NewsCard n={n} variante="fila" numero={i + 2} />
                </Reveal>
              ))}
              <Reveal delay={0.1 + laterales.length * 0.1} className="h-full">
                <ClimaCard />
              </Reveal>
            </div>
          </div>

          {abajo.length > 0 ? (
            // Una sola nota se muestra ancha y dos o tres se reparten el ancho: la fila nunca queda coja.
            <div className={cn("grid gap-4", abajo.length >= 2 && "md:grid-cols-2", abajo.length >= 3 && "lg:grid-cols-3")}>
              {abajo.map((n, i) => (
                <Reveal key={n.id} delay={i * 0.1} className="h-full">
                  <NewsCard n={n} variante={abajo.length === 1 ? "ancha" : "tarjeta"} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <Newspaper className="size-10 text-ink/30" aria-hidden />
          <p className="text-xl font-bold">Todavía no hay noticias publicadas</p>
          <p className="max-w-md text-base text-ink/70">Cuando subamos la primera nota, la vas a ver acá.</p>
        </div>
      )}
      </div>
    </section>
  );
}
