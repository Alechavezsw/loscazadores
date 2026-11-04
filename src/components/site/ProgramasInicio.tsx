import { Reveal } from "@/components/Reveal";
import { urlLiveDelCanal } from "@/lib/live";
import type { Ajustes } from "@/lib/types";
import { limpiarUrl, perfilYoutube } from "@/lib/urls";
import { SectionTitle } from "./Brand";
import { BailongoCard } from "./BailongoCard";
import { TomateveCard } from "./TomateveCard";

/** Los dos cuadros de la sección: Toma TV (en vivo por YouTube, con sus programas) y Radio del Sur (Se Armó el Bailongo). */
export function ProgramasInicio({ ajustes }: { ajustes: Pick<Ajustes, "tomateve" | "radioEnlace"> }) {
  return (
    <section aria-labelledby="programas-titulo" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
      <Reveal>
        <SectionTitle id="programas-titulo" eyebrow="Streaming y radio">Nuestros programas</SectionTitle>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Reveal className="h-full">
          <TomateveCard configurado={Boolean(urlLiveDelCanal(ajustes.tomateve))} canalUrl={perfilYoutube(ajustes.tomateve)} />
        </Reveal>
        <Reveal delay={0.1} className="h-full">
          <BailongoCard enlace={limpiarUrl(ajustes.radioEnlace)} />
        </Reveal>
      </div>
    </section>
  );
}
