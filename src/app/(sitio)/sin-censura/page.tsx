import type { Metadata } from "next";
import { Play } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { HistoriaCta } from "@/components/site/HistoriaCta";
import { PageHeader } from "@/components/site/PageHeader";
import { VideoCard } from "@/components/site/VideoCard";
import { VideoDestacado } from "@/components/site/VideoDestacado";
import { getAjustes, getVideos } from "@/lib/queries";
import { JsonLd } from "@/components/site/JsonLd";
import { ldListado, ldMigas, metaPagina } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { linkWhatsapp } from "@/lib/urls";

export async function generateMetadata(): Promise<Metadata> {
  const { nombreVideos } = await getAjustes();
  return metaPagina({
    titulo: nombreVideos,
    descripcion: `${nombreVideos}: los videos de Los Cazadores de Noticias, tal cual llegan, con la voz de los vecinos.`,
    // /videos sigue andando como alias, pero la dirección propia de la sección es /sin-censura.
    ruta: "/sin-censura",
  });
}

export default async function Videos() {
  const [piezas, ajustes] = await Promise.all([getVideos(), getAjustes()]);
  const principal = piezas.find((p) => p.destacada) ?? piezas[0];
  const resto = piezas.filter((p) => p.id !== principal?.id);
  const contactoHref = linkWhatsapp(ajustes.whatsappContacto, "Hola, quiero mandarles un video.");
  const sitio = urlSitio();

  return (
    <>
      <JsonLd
        datos={ldListado(sitio, {
          nombre: ajustes.nombreVideos,
          descripcion: `${ajustes.nombreVideos}: los videos de Los Cazadores de Noticias, tal cual llegan, con la voz de los vecinos.`,
          ruta: "/sin-censura",
          items: piezas.map((p) => ({ nombre: p.titulo, ruta: `/sin-censura/${p.slug}` })),
        })}
      />
      <JsonLd datos={ldMigas(sitio, [{ nombre: ajustes.nombreVideos, ruta: "/sin-censura" }])} />
      <PageHeader
        etiqueta="Videos"
        titulo={ajustes.nombreVideos}
        bajada="Los videos de Los Cazadores de Noticias, tal cual llegan, con la voz de los vecinos."
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-6 md:py-16">
        {principal ? (
          <div className="flex flex-col gap-12">
            <Reveal>
              <div className="rounded-2xl bg-ink p-4 md:p-8">
                <VideoDestacado p={principal} />
              </div>
            </Reveal>

            {resto.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resto.map((p, i) => (
                  <li key={p.id} className="h-full">
                    <Reveal delay={(i % 3) * 0.1} className="h-full">
                      <VideoCard p={p} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <Play weight="fill" className="size-10 text-ink/30" aria-hidden />
            <p className="text-xl font-bold">Todavía no hay videos publicados</p>
            <p className="max-w-md text-base text-ink/70">Cuando subamos el primer video, lo vas a ver acá.</p>
          </div>
        )}
      </div>

      <p className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs leading-relaxed text-ink/70 md:text-sm">{ajustes.aviso}</p>

      <HistoriaCta ajustes={ajustes} contactoHref={contactoHref} />
    </>
  );
}
