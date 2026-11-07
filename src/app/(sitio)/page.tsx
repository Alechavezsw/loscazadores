import { Info } from "@phosphor-icons/react/ssr";
import { ChannelRail } from "@/components/site/ChannelRail";
import { EspaciosInicio } from "@/components/site/EspaciosInicio";
import { HistoriaCta } from "@/components/site/HistoriaCta";
import { LatestNews } from "@/components/site/LatestNews";
import { LiveSection } from "@/components/site/LiveSection";
import { Masthead } from "@/components/site/Masthead";
import { ProgramasInicio } from "@/components/site/ProgramasInicio";
import { Promos } from "@/components/site/Promos";
import { TaglineReveal } from "@/components/site/TaglineReveal";
import { Ticker } from "@/components/site/Ticker";
import { VideosInicio } from "@/components/site/VideosInicio";
import { getAjustes, getAnuncios, getNoticias, getVideos } from "@/lib/queries";
import { linkWhatsapp, perfilYoutube } from "@/lib/urls";
import { getUltimoVideo } from "@/lib/youtube-canal";

export default async function Inicio() {
  const ajustesPendiente = getAjustes();
  const [ajustes, noticias, anuncios, videos, ultimoVideo] = await Promise.all([
    ajustesPendiente,
    getNoticias(),
    getAnuncios(),
    getVideos(),
    // El último video sale del mismo canal que el enlace de la columna de YouTube.
    ajustesPendiente.then((a) => getUltimoVideo(a.youtube || a.tomateve)),
  ]);
  const consultaHref = linkWhatsapp(ajustes.whatsappContacto, "Hola, quiero publicitar en Los Cazadores de Noticias.");
  const noticiaHref = linkWhatsapp(ajustes.whatsappContacto, "Hola, quiero mandarles una noticia.");
  // Las noticias de Viva Feria y Servicios tienen su propio espacio y no se repiten en las últimas noticias.
  const generales = noticias.filter((n) => !n.espacio);

  return (
    <>
      <Masthead lema={ajustes.lema} contactoHref={noticiaHref} />
      <LiveSection canalUrl={perfilYoutube(ajustes.youtube)} />
      <Ticker noticias={noticias} />

      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 pt-6 text-xs leading-relaxed text-ink/70 md:items-center md:text-sm">
        <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-hunter md:mt-0" aria-hidden />
        <p>{ajustes.aviso}</p>
      </div>

      <ChannelRail noticias={noticias} anuncios={anuncios} ajustes={ajustes} ultimoVideo={ultimoVideo} />
      <LatestNews noticias={generales} />
      <EspaciosInicio noticias={noticias} />
      <ProgramasInicio ajustes={ajustes} />
      <VideosInicio piezas={videos} nombre={ajustes.nombreVideos} />

      <div className="border-t border-white/10 bg-ink">
        <TaglineReveal etiqueta="Los Cazadores de Noticias" texto={ajustes.declaracion} className="pb-12 md:pb-16" />
        <HistoriaCta ajustes={ajustes} contactoHref={noticiaHref} oscuro />
      </div>

      <div className="pt-16 md:pt-24">
        <Promos anuncios={anuncios} consultaHref={consultaHref} />
      </div>
    </>
  );
}
