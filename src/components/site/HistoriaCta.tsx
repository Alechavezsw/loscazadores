import { Quotes, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import type { Ajustes } from "@/lib/types";
import { telefonoLegible } from "@/lib/urls";

/**
 * «Tu historia también cuenta»: invitación a mandar información por WhatsApp, con el número grande y con
 * enlace directo. El título y el texto (que va entre comillas decorativas, una de cada lado) se editan desde
 * Ajustes. No lleva fondo propio: se apoya en el de la franja donde se pone.
 */
export function HistoriaCta({
  ajustes,
  contactoHref,
}: {
  ajustes: Pick<Ajustes, "historiaTitulo" | "historiaTexto" | "whatsappContacto">;
  contactoHref: string;
}) {
  const numero = telefonoLegible(ajustes.whatsappContacto);
  if (!contactoHref || !numero) return null;

  return (
    <section aria-labelledby="historia-titulo" className="px-4 pb-16 md:px-6 md:pb-24">
      <Reveal>
        <div className="trama relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-hunter text-white">
          <WhatsappLogo
            weight="fill"
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-10 size-80 -rotate-12 text-white/10"
          />
          <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:gap-12 md:p-14">
            <div>
              <h2 id="historia-titulo" className="text-3xl font-bold tracking-tight md:text-5xl">
                {ajustes.historiaTitulo}
              </h2>
              {/* Una comilla decorativa de cada lado: abre el texto y lo cierra. */}
              <blockquote className="mt-6 text-xl font-semibold leading-snug md:text-2xl">
                <Quotes weight="fill" aria-hidden className="mr-2 inline-block size-7 -translate-y-1 rotate-180 text-white/90 md:size-9" />
                {ajustes.historiaTexto}
                <Quotes weight="fill" aria-hidden className="ml-2 inline-block size-7 -translate-y-1 text-white/90 md:size-9" />
              </blockquote>
            </div>

            <div className="flex flex-col items-start gap-4">
              <p className="text-sm font-bold uppercase tracking-widest text-white/80">Mandanos tu información</p>
              <a
                href={contactoHref}
                data-evento="enviar-noticia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribinos por WhatsApp al ${numero}`}
                className="flex items-center gap-3 whitespace-nowrap text-4xl font-extrabold tracking-tight transition-opacity duration-700 ease-fluid hover:opacity-85 sm:text-5xl md:text-6xl"
              >
                <WhatsappLogo weight="fill" className="size-9 shrink-0 sm:size-11 md:size-14" aria-hidden />
                {numero}
              </a>
              <a
                href={contactoHref}
                data-evento="enviar-noticia"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-hunter transition-all duration-700 ease-fluid hover:bg-white/90 active:scale-[0.98]"
              >
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
