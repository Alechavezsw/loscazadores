import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { Photo, SectionTitle, Skeleton } from "@/components/site/Brand";
import { JsonLd } from "@/components/site/JsonLd";
import { Compartir } from "@/components/site/Compartir";
import { FondoNoche } from "@/components/site/Fondo";
import { Incrustados } from "@/components/site/Incrustados";
import { VideoCard } from "@/components/site/VideoCard";
import { fechaCompleta, parrafos, resumen } from "@/lib/format";
import { srcImagen, srcImagenAbsoluto, srcVideo, srcVideoAbsoluto, tarjetaVideo, tipoVideo } from "@/lib/imagen-url";
import { getAjustes, getVideo, getVideos } from "@/lib/queries";
import { metaPagina } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";

export async function generateMetadata({ params }: PageProps<"/sin-censura/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [p, { nombreVideos }] = await Promise.all([getVideo(slug), getAjustes()]);
  if (!p) return { title: "No encontrado", robots: { index: false, follow: false } };
  const descripcion = resumen(p.cuerpo || p.titulo, 160);
  return metaPagina({
    titulo: p.titulo,
    descripcion: descripcion || `${p.titulo}. Video de ${nombreVideos}.`,
    // /videos/<video> sigue andando como alias, pero la dirección propia es /sin-censura/<video>.
    ruta: `/sin-censura/${p.slug}`,
    imagen: p.imagen,
    // Sin carátula, la vista previa es una tarjeta armada con el título del video, no la genérica de la marca.
    tarjeta: tarjetaVideo(p),
    video: p.video ? { url: srcVideoAbsoluto(p.video, urlSitio()), tipo: tipoVideo(p.video) } : null,
    tipo: "video.other",
    publicado: p.creada,
  });
}

function Cargando() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-32">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-16 w-full" />
      <Skeleton className="mt-6 aspect-video w-full" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  );
}

/** Marco del video: negro y sin sombras, como el resto del sitio. */
const MARCO = "rounded-2xl bg-ink";

async function Video({ params }: { params: PageProps<"/sin-censura/[slug]">["params"] }) {
  const { slug } = await params;
  const [p, ajustes] = await Promise.all([getVideo(slug), getAjustes()]);
  if (!p) notFound();

  const todas = await getVideos();
  const mas = todas.filter((x) => x.id !== p.id).slice(0, 3);
  const sitio = urlSitio();
  const url = `${sitio}/sin-censura/${p.slug}`;

  return (
    <>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: p.titulo,
          description: resumen(p.cuerpo || p.titulo, 160) || p.titulo,
          thumbnailUrl: p.imagen ? srcImagenAbsoluto(p.imagen, sitio) : `${sitio}${tarjetaVideo(p)}`,
          uploadDate: p.creada,
          ...(p.video ? { contentUrl: srcVideoAbsoluto(p.video, sitio) } : {}),
          url,
          publisher: { "@type": "Organization", name: "Los Cazadores de Noticias" },
        }}
      />
      <header className="relative isolate overflow-hidden bg-ink px-4 pb-12 pt-32 text-white md:px-6 md:pb-16 md:pt-40">
        <FondoNoche lado="der" />
        <div className="mx-auto max-w-3xl">
          <Reveal immediate y={24}>
            <Link
              href="/sin-censura"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors duration-700 ease-fluid hover:text-white"
            >
              <ArrowLeft weight="bold" className="size-4 transition-transform duration-700 ease-fluid group-hover:-translate-x-1" aria-hidden />
              {ajustes.nombreVideos}
            </Link>
            <time dateTime={p.creada} className="mt-6 block text-sm font-semibold uppercase tracking-widest text-hunter first-letter:uppercase">
              {fechaCompleta(p.creada)}
            </time>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">{p.titulo}</h1>
          </Reveal>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
          <div className="h-full w-1/3 animate-scan bg-hunter" />
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 md:pt-14">
        {p.video ? (
          <Reveal immediate delay={0.15} y={32}>
            <figure className={`overflow-hidden ${MARCO}`}>
              <video
                src={srcVideo(p.video)}
                poster={p.imagen ? srcImagen(p.imagen) : undefined}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-ink object-contain"
              >
                Tu navegador no puede reproducir este video.
              </video>
            </figure>
          </Reveal>
        ) : null}

        <Incrustados urls={p.incrustados ?? []} titulo={p.titulo} marco={`${MARCO} overflow-hidden`} />

        {!p.video && (p.incrustados ?? []).length === 0 && p.imagen ? (
          <div className={`aspect-video overflow-hidden ${MARCO}`}>
            <Photo nombre={p.imagen} alt={p.titulo} priority />
          </div>
        ) : null}

        {p.cuerpo ? (
          <div className="mt-10 flex flex-col gap-6 text-lg leading-relaxed text-ink/90">
            {parrafos(p.cuerpo).map((texto, i) => (
              <p key={i}>{texto}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-10 border-t border-line pt-6">
          <Compartir url={url} titulo={p.titulo} />
        </div>
      </article>

      {mas.length > 0 ? (
        <section aria-labelledby="mas-videos" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
          <Reveal>
            <SectionTitle id="mas-videos">Más videos</SectionTitle>
          </Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mas.map((m, i) => (
              <li key={m.id} className="h-full">
                <Reveal delay={i * 0.1} className="h-full">
                  <VideoCard p={m} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export default function Pagina({ params }: PageProps<"/sin-censura/[slug]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Video params={params} />
    </Suspense>
  );
}
