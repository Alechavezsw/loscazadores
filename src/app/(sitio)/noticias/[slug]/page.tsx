import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { BrandCover, Photo, SectionTitle, Skeleton } from "@/components/site/Brand";
import { JsonLd } from "@/components/site/JsonLd";
import { CANAL_UI } from "@/components/site/canales";
import { Compartir } from "@/components/site/Compartir";
import { Incrustados } from "@/components/site/Incrustados";
import { NewsCard } from "@/components/site/NewsCard";
import { cuerpoSinTitulo, fechaCompleta, parrafos, resumen } from "@/lib/format";
import { srcImagen, srcImagenAbsoluto, srcVideo } from "@/lib/imagen-url";
import { getNoticia, getNoticias } from "@/lib/queries";
import { CANALES, type Noticia } from "@/lib/types";
import { embedFacebook, embedInstagram, idVideoYoutube, normalizarEnlace } from "@/lib/urls";
import { metaPagina } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";

export async function generateMetadata({ params }: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const n = await getNoticia(slug);
  if (!n) return { title: "Noticia no encontrada", robots: { index: false, follow: false } };
  return metaPagina({
    titulo: n.titulo,
    descripcion: resumen(n.cuerpo, 160) || n.titulo,
    ruta: `/noticias/${n.slug}`,
    imagen: n.imagen,
    tipo: "article",
    publicado: n.creada,
    actualizado: n.actualizada,
    seccion: n.categoria,
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

function Originales({ n, omitir }: { n: Noticia; omitir: Set<string> }) {
  // Lo que ya se incrustó a mano no se repite acá abajo.
  const nuevo = (url: string | undefined) => (url && !omitir.has(normalizarEnlace(url)) ? url : undefined);
  const ig = nuevo(n.enlaces.instagram) ? embedInstagram(n.enlaces.instagram!) : null;
  const fb = nuevo(n.enlaces.facebook) ? embedFacebook(n.enlaces.facebook!) : null;
  const yt = nuevo(n.enlaces.youtube) ? idVideoYoutube(n.enlaces.youtube!) : null;
  const sinEmbed = CANALES.filter(
    (c) =>
      nuevo(n.enlaces[c]) &&
      !((c === "instagram" && ig) || (c === "facebook" && fb) || (c === "youtube" && yt)),
  );
  if (!ig && !fb && !yt && sinEmbed.length === 0) return null;

  const marco = "overflow-hidden rounded-2xl border border-line bg-white";

  return (
    <section aria-labelledby="originales" className="mt-12">
      <h2 id="originales" className="text-2xl font-bold tracking-tight">
        Mirala en las redes
      </h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {ig ? (
          <div className={marco}>
            <iframe title="Publicación de Instagram" src={ig} loading="lazy" className="h-[720px] w-full" />
          </div>
        ) : null}
        {fb ? (
          <div className={marco}>
            <iframe title="Publicación de Facebook" src={fb.src} loading="lazy" style={{ height: fb.alto }} className="w-full" />
          </div>
        ) : null}
        {yt ? (
          <div className={`${marco} md:col-span-2`}>
            <div className="relative aspect-video">
              <iframe
                title="Video de YouTube"
                src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>
          </div>
        ) : null}
      </div>
      {sinEmbed.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-3">
          {sinEmbed.map((c) => {
            const ui = CANAL_UI[c];
            return (
              <li key={c}>
                <a
                  href={n.enlaces[c]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid active:scale-[0.98] ${ui.boton}`}
                >
                  <ui.Icono weight="fill" className="size-5" aria-hidden />
                  {ui.cta}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

async function Articulo({ params }: { params: PageProps<"/noticias/[slug]">["params"] }) {
  const { slug } = await params;
  const n = await getNoticia(slug);
  if (!n) notFound();

  const todas = await getNoticias();
  const relacionadas = [
    ...todas.filter((x) => x.id !== n.id && x.categoria === n.categoria),
    ...todas.filter((x) => x.id !== n.id && x.categoria !== n.categoria),
  ].slice(0, 3);

  const sitio = urlSitio();
  const url = `${sitio}/noticias/${n.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.titulo,
    description: resumen(n.cuerpo, 160) || n.titulo,
    datePublished: n.creada,
    dateModified: n.actualizada,
    articleSection: n.categoria,
    image: [n.imagen ? srcImagenAbsoluto(n.imagen, sitio) : `${sitio}/brand/og.png`],
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Los Cazadores de Noticias", url: sitio },
    publisher: {
      "@type": "Organization",
      name: "Los Cazadores de Noticias",
      logo: { "@type": "ImageObject", url: `${sitio}/brand/og.png` },
    },
  };

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-32 md:pt-40">
        <JsonLd datos={jsonLd} />

        <Reveal immediate y={24}>
          <Link
            href="/noticias"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors duration-700 ease-fluid hover:text-ink"
          >
            <ArrowLeft className="size-4 transition-transform duration-700 ease-fluid group-hover:-translate-x-1" aria-hidden />
            Todas las noticias
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-hunter px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {n.categoria}
            </span>
            {n.zona ? <span className="text-sm font-semibold uppercase tracking-wide text-ink/60">{n.zona}</span> : null}
            {n.urgente ? <span className="text-sm font-bold uppercase tracking-wide text-hunter">Última hora</span> : null}
          </div>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">{n.titulo}</h1>
          <p className="mt-4 text-sm text-ink/60 first-letter:uppercase">
            <time dateTime={n.creada}>{fechaCompleta(n.creada)}</time>
          </p>
        </Reveal>

        <Reveal immediate delay={0.15} y={32} className="mt-8">
          <figure className="overflow-hidden rounded-2xl bg-ink">
            {n.video ? (
              // Si la nota tiene un video subido, ocupa el lugar de la foto y esta pasa a ser su carátula.
              <video
                src={srcVideo(n.video)}
                poster={n.imagen ? srcImagen(n.imagen) : undefined}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-ink object-contain"
              >
                Tu navegador no puede reproducir este video.
              </video>
            ) : (
              <div className="aspect-video">
                {n.imagen ? (
                  <Photo nombre={n.imagen} alt={n.titulo} priority />
                ) : (
                  <BrandCover etiqueta={n.categoria} esquina className="size-full" />
                )}
              </div>
            )}
          </figure>
        </Reveal>

        <div className="mt-8 flex flex-col gap-6 text-lg leading-relaxed text-ink/90">
          {parrafos(cuerpoSinTitulo(n.titulo, n.cuerpo)).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <Incrustados urls={n.incrustados ?? []} titulo={n.titulo} />

        <div className="mt-10 border-t border-line pt-6">
          <Compartir url={url} titulo={n.titulo} />
        </div>

        <Originales n={n} omitir={new Set((n.incrustados ?? []).map(normalizarEnlace))} />
      </article>

      {relacionadas.length > 0 ? (
        <section aria-labelledby="mas-noticias" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
          <Reveal>
            <SectionTitle id="mas-noticias">Seguí leyendo</SectionTitle>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relacionadas.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.1} className="h-full">
                <NewsCard n={r} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function Pagina({ params }: PageProps<"/noticias/[slug]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Articulo params={params} />
    </Suspense>
  );
}
