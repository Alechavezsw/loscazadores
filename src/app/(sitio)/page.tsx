import type { Metadata } from "next";
import { Info } from "@phosphor-icons/react/ssr";
import { JsonLd } from "@/components/site/JsonLd";
import { metaPagina } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { BannerPublicidad } from "@/components/site/BannerPublicidad";
import { CarruselProgramas } from "@/components/site/CarruselProgramas";
import { ChannelRail } from "@/components/site/ChannelRail";
import { EspaciosInicio, estaEnComunidad } from "@/components/site/EspaciosInicio";
import { Banda } from "@/components/site/Fondo";
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
import { limpiarUrl, linkWhatsapp, perfilYoutube } from "@/lib/urls";
import { getUltimoVideo } from "@/lib/youtube-canal";

export async function generateMetadata(): Promise<Metadata> {
  const { lema } = await getAjustes();
  const frase = lema || "Las noticias de tu barrio al instante";
  return metaPagina({
    titulo: "Los Cazadores de Noticias",
    tituloAbsoluto: `Los Cazadores de Noticias | ${frase}`,
    descripcion: `${frase}. Diario digital de San Juan: lo último del barrio, los videos y las transmisiones en vivo.`,
    ruta: "/",
  });
}

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
  // Las noticias que tienen su propio espacio (Servicios) o van en una tarjeta exclusiva de «Comunidad» (Tapá mi
  // número, Cartas de la Vieja Pocha) no se repiten en las últimas noticias.
  const generales = noticias.filter((n) => !n.espacio && !estaEnComunidad(n));

  // La portada es una sucesión de bandas con su propio fondo (ver components/site/Fondo.tsx). El ritmo de tonos es:
  // noche (cabecera) → papel → blanco → papel → noche (videos) → grafito (cierre) → noche (pie). El disco rojo y la
  // lupa van y vienen de lado a lado al bajar.
  const sitio = urlSitio();

  return (
    <>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          name: "Los Cazadores de Noticias",
          url: sitio,
          description: ajustes.lema,
          logo: `${sitio}/brand/og.png`,
        }}
      />
      <Masthead lema={ajustes.lema} contactoHref={noticiaHref} />
      <LiveSection canalUrl={perfilYoutube(ajustes.youtube)} />
      <Ticker noticias={noticias} />

      <Banda tono="claro" lado="der" medio>
        <div className="px-4 pt-8">
          <div className="relative mx-auto flex max-w-3xl items-start gap-3 overflow-hidden rounded-2xl border border-line bg-white px-4 py-4 text-xs leading-relaxed text-ink/70 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.55)] md:items-center md:text-sm">
            <div aria-hidden className="trama-papel pointer-events-none absolute inset-0" />
            <Info weight="fill" className="relative mt-0.5 size-5 shrink-0 text-hunter md:mt-0" aria-hidden />
            <p className="relative">{ajustes.aviso}</p>
          </div>
        </div>

        <BannerPublicidad
          anuncio={anuncios.find((a) => a.slot === "banner" && a.imagen) ?? null}
          consultaHref={consultaHref}
          className="pt-8 md:pt-10"
        />
        <ChannelRail noticias={noticias} anuncios={anuncios} ajustes={ajustes} ultimoVideo={ultimoVideo} />
        <Promos anuncios={anuncios} consultaHref={consultaHref} />
      </Banda>

      <Banda tono="blanco" lado="izq">
        <LatestNews noticias={generales} />
      </Banda>

      <Banda tono="claro" lado="izq" lupa medio>
        <EspaciosInicio noticias={noticias} radioEnlace={limpiarUrl(ajustes.radioEnlace)} />
        <BannerPublicidad
          anuncio={anuncios.find((a) => a.slot === "banner-2" && a.imagen) ?? null}
          consultaHref={consultaHref}
          className="pb-16 md:pb-24"
        />
        <ProgramasInicio ajustes={ajustes} ultimoVideo={ultimoVideo} />
      </Banda>

      <VideosInicio piezas={videos} nombre={ajustes.nombreVideos} />

      <Banda tono="grafito" lado="der">
        <TaglineReveal etiqueta="Los Cazadores de Noticias" texto={ajustes.declaracion} className="pb-12 md:pb-16" />
        <HistoriaCta ajustes={ajustes} contactoHref={noticiaHref} />
        <CarruselProgramas />
      </Banda>
    </>
  );
}
