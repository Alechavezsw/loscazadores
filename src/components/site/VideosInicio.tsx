import { Reveal } from "@/components/Reveal";
import type { PiezaSC } from "@/lib/types";
import { SectionTitle } from "./Brand";
import { FondoNoche } from "./Fondo";
import { VideoDestacado } from "./VideoDestacado";

/** Franja de la portada con el video principal y el botón «Ver todo». Si no hay videos publicados, no se muestra. */
export function VideosInicio({ piezas, nombre }: { piezas: PiezaSC[]; nombre: string }) {
  if (piezas.length === 0) return null;
  const principal = piezas.find((p) => p.destacada) ?? piezas[0];

  return (
    <section aria-labelledby="videos-titulo" className="relative isolate overflow-hidden bg-ink px-4 py-16 text-white md:px-6 md:py-24">
      <FondoNoche lado="der" lupa />
      <div className="relative mx-auto w-full max-w-[1440px]">
        <Reveal>
          <SectionTitle id="videos-titulo" eyebrow="Videos">{nombre}</SectionTitle>
        </Reveal>
        <Reveal className="mt-10" delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-8">
            <VideoDestacado p={principal} verTodo={{ href: "/sin-censura", texto: "Ver todo" }} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
