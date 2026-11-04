import { Reveal } from "@/components/Reveal";

/** Cabecera negra de las páginas interiores. Deja lugar arriba para la píldora de navegación. */
export function PageHeader({ etiqueta, titulo, bajada }: { etiqueta: string; titulo: string; bajada?: string }) {
  return (
    <header className="relative overflow-hidden bg-ink px-4 pb-12 pt-32 text-white md:px-6 md:pb-16 md:pt-40">
      <div className="mx-auto max-w-[1440px]">
        <Reveal immediate y={24}>
          <p className="font-mono text-sm uppercase tracking-widest text-hunter">{etiqueta}</p>
          <h1 className="mt-3 max-w-[680px] text-5xl font-bold uppercase tracking-tight md:text-7xl">{titulo}</h1>
          {bajada ? <p className="mt-4 max-w-[680px] text-base text-white/70 md:text-lg">{bajada}</p> : null}
        </Reveal>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
        <div className="h-full w-1/3 animate-scan bg-hunter" />
      </div>
    </header>
  );
}
