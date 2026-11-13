import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/site/Brand";
import { EnVivoPanel } from "@/components/site/EnVivoPanel";
import { NewsCard } from "@/components/site/NewsCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getAjustes, getNoticias } from "@/lib/queries";
import { metaPagina } from "@/lib/seo";
import { limpiarUrl, perfilYoutube } from "@/lib/urls";

export const metadata: Metadata = metaPagina({
  titulo: "En vivo",
  descripcion: "Mirá las transmisiones en vivo de Los Cazadores de Noticias por YouTube.",
  ruta: "/en-vivo",
});

export default async function EnVivo() {
  const [ajustes, noticias] = await Promise.all([getAjustes(), getNoticias()]);

  return (
    <>
      <PageHeader
        etiqueta="Transmisión"
        titulo="En vivo"
        bajada="Cuando salimos al aire por YouTube, el video aparece acá solo. No hace falta actualizar la página."
      />
      <EnVivoPanel canalUrl={perfilYoutube(ajustes.youtube) || perfilYoutube(ajustes.tomateve)}whatsappCanalUrl={limpiarUrl(ajustes.whatsappCanal)} />

      {noticias.length > 0 ? (
        <section aria-labelledby="mientras-tanto" className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-6 md:pb-24">
          <Reveal>
            <SectionTitle id="mientras-tanto">Lo último</SectionTitle>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {noticias.slice(0, 3).map((n, i) => (
              <Reveal key={n.id} delay={i * 0.1} className="h-full">
                <NewsCard n={n} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
