import { Suspense } from "react";
import { Analitica } from "@/components/Analitica";
import { LiveProvider } from "@/components/LiveProvider";
import { Footer } from "@/components/site/Footer";
import { PillNav, PillNavSinRuta } from "@/components/site/PillNav";
import { RadioDelSur } from "@/components/site/RadioDelSur";
import { getAjustes } from "@/lib/queries";
import { linkWhatsapp } from "@/lib/urls";

export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const ajustes = await getAjustes();
  const contactoHref = linkWhatsapp(ajustes.whatsappContacto, "Hola, quiero mandarles una noticia.");

  return (
    <LiveProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Saltar al contenido
      </a>
      <div className="relative flex flex-1 flex-col">
        <Suspense fallback={<PillNavSinRuta contactoHref={contactoHref} nombreVideos={ajustes.nombreVideos} />}>
          <PillNav contactoHref={contactoHref} nombreVideos={ajustes.nombreVideos} />
        </Suspense>
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer ajustes={ajustes} contactoHref={contactoHref} />
      </div>
      <RadioDelSur />
      <Suspense fallback={null}>
        <Analitica />
      </Suspense>
    </LiveProvider>
  );
}
