import { ArrowDown, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/Reveal";
import { Logo } from "./Brand";
import { ClimaMini } from "./ClimaCard";
import { FondoNoche } from "./Fondo";
import { MastheadFX } from "./MastheadFX";

export function Masthead({ lema, contactoHref }: { lema: string; contactoHref: string }) {
  return (
    <div className="relative isolate overflow-hidden bg-ink text-white">
      <FondoNoche />
      <MastheadFX />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-24 text-center md:pb-24 md:pt-32">
        <h1 className="w-full max-w-[840px]">
          <span className="sr-only">Los Cazadores de Noticias, Diario Digital</span>
          <Reveal immediate y={24}>
            <Logo shine className="w-full" />
          </Reveal>
        </h1>

        <Reveal immediate delay={0.25} y={16} className="mt-6 max-w-full">
          <p aria-label={`“${lema}”`} className="text-sm font-medium text-white/90 md:text-xl">
            <span
              aria-hidden
              className="typewriter caret"
              style={{ "--chars": lema.length + 2 } as React.CSSProperties}
            >
              “{lema}”
            </span>
          </p>
        </Reveal>

        <Reveal immediate delay={0.35} y={12} className="mt-6">
          <ClimaMini />
        </Reveal>

        <Reveal immediate delay={0.45} y={16} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {contactoHref ? (
            <a
              href={contactoHref}
              data-evento="enviar-noticia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:-translate-y-0.5 hover:bg-hunter-dark active:scale-[0.98]"
            >
              <WhatsappLogo weight="fill" className="size-5" aria-hidden />
              Enviá tu noticia
            </a>
          ) : null}
          <a
            href="#ultimas-titulo"
            className="flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-all duration-700 ease-fluid hover:-translate-y-0.5 hover:bg-white hover:text-ink active:scale-[0.98]"
          >
            Ver las últimas noticias
            <ArrowDown weight="bold" className="size-4" aria-hidden />
          </a>
        </Reveal>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
        <div className="h-full w-1/3 animate-scan bg-hunter" />
      </div>
    </div>
  );
}
