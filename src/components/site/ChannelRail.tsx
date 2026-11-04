import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "./Brand";
import { handleInstagram, linkWhatsapp, perfilInstagram, perfilYoutube, limpiarUrl } from "@/lib/urls";
import { CANALES, type Ajustes, type Anuncio, type Canal, type Noticia } from "@/lib/types";
import { AdRail } from "./AdRail";
import { ChannelCard } from "./ChannelCard";

type Props = {
  noticias: Noticia[];
  anuncios: Anuncio[];
  ajustes: Ajustes;
};

export function ChannelRail({ noticias, anuncios, ajustes }: Props) {
  const perfil: Record<Canal, string> = {
    whatsapp: limpiarUrl(ajustes.whatsappCanal),
    instagram: perfilInstagram(ajustes.instagram),
    facebook: limpiarUrl(ajustes.facebook),
    // La columna de YouTube es la de Toma TV: si no tiene su propio enlace, usa el canal de los programas.
    youtube: perfilYoutube(ajustes.youtube) || perfilYoutube(ajustes.tomateve),
  };
  const handleIg = handleInstagram(ajustes.instagram);
  const consultaHref = linkWhatsapp(ajustes.whatsappContacto, "Hola, quiero publicitar en Los Cazadores de Noticias.");
  const lateral = (slot: Anuncio["slot"]) => anuncios.find((a) => a.slot === slot) ?? null;

  return (
    <section aria-labelledby="canales-titulo" className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <SectionTitle id="canales-titulo" eyebrow="Seguinos">Lo último en nuestras redes</SectionTitle>
      </Reveal>
      <div className="mt-10 grid gap-4 xl:grid-cols-[112px_minmax(0,1fr)_112px]">
        <Reveal className="hidden xl:flex" y={32}>
          <AdRail anuncio={lateral("lateral-izq")} consultaHref={consultaHref} className="w-full" />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CANALES.map((canal, i) => (
            <Reveal key={canal} delay={i * 0.1} className="h-full">
              <ChannelCard
                canal={canal}
                noticia={noticias.find((n) => n.canales.includes(canal)) ?? null}
                perfilUrl={perfil[canal]}
                handleIg={handleIg}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="hidden xl:flex" y={32} delay={0.2}>
          <AdRail anuncio={lateral("lateral-der")} consultaHref={consultaHref} className="w-full" />
        </Reveal>
      </div>
    </section>
  );
}
