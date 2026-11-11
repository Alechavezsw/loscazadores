import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "./Brand";
import { handleInstagram, perfilInstagram, perfilYoutube, limpiarUrl } from "@/lib/urls";
import { CANALES, type Ajustes, type Canal, type Noticia } from "@/lib/types";
import { ChannelCard } from "./ChannelCard";
import type { VideoCanal } from "@/lib/youtube-canal";

type Props = {
  noticias: Noticia[];
  ajustes: Ajustes;
  /** El último video del canal de YouTube; la columna de YouTube lo muestra en lugar de una nota. */
  ultimoVideo?: VideoCanal | null;
};

export function ChannelRail({ noticias, ajustes, ultimoVideo }: Props) {
  const perfil: Record<Canal, string> = {
    whatsapp: limpiarUrl(ajustes.whatsappCanal),
    instagram: perfilInstagram(ajustes.instagram),
    facebook: limpiarUrl(ajustes.facebook),
    // La columna de YouTube es la de Tomateteve: si no tiene su propio enlace, usa el canal de los programas.
    youtube: perfilYoutube(ajustes.youtube) || perfilYoutube(ajustes.tomateve),
  };
  const handleIg = handleInstagram(ajustes.instagram);

  return (
    <section aria-labelledby="canales-titulo" className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <SectionTitle id="canales-titulo" eyebrow="Seguinos">Lo último en nuestras redes</SectionTitle>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CANALES.map((canal, i) => (
          <Reveal key={canal} delay={i * 0.1} className="h-full">
            <ChannelCard
              canal={canal}
              noticia={noticias.find((n) => n.canales.includes(canal)) ?? null}
              perfilUrl={perfil[canal]}
              handleIg={handleIg}
              video={canal === "youtube" ? ultimoVideo : null}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
