import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Sistema de fondos de la marca. Todo es plano (sin degradados) y sale de los mismos motivos, para que la portada y
 * las páginas se lean como una sola familia:
 *  - un color de base: negro, grafito, papel o blanco;
 *  - la trama de puntos del logo;
 *  - un disco rojo grande, cortado por el borde de la franja;
 *  - aros concéntricos, en línea, del lado opuesto;
 *  - un punto rojo chico, como el mango de la lupa;
 *  - opcional, la lupa del logo enorme y en línea, como sello.
 * Cada franja cambia de `lado` (izquierda o derecha) para que el motivo vaya y venga al bajar por la página.
 */
export type Tono = "noche" | "grafito" | "claro" | "blanco";
export type Lado = "izq" | "der";

const BASE: Record<Tono, string> = {
  noche: "bg-ink",
  grafito: "bg-ink-1",
  claro: "bg-paper",
  blanco: "bg-white",
};

const esOscuro = (t: Tono) => t === "noche" || t === "grafito";

/** La lupa del logo, enorme y en línea: el sello de la marca. El mango es el único trazo rojo. */
function LupaSello({ oscuro, className }: { oscuro: boolean; className?: string }) {
  const aro = oscuro ? "stroke-white/10" : "stroke-ink/10";
  return (
    <svg aria-hidden viewBox="0 0 400 400" fill="none" className={cn("absolute", className)}>
      <circle cx="165" cy="165" r="125" strokeWidth="10" className={aro} />
      <circle cx="165" cy="165" r="96" strokeWidth="2" className={aro} />
      <path d="M258 258 362 362" strokeWidth="30" strokeLinecap="round" className={oscuro ? "stroke-hunter/50" : "stroke-hunter/25"} />
    </svg>
  );
}

type FondoProps = {
  tono: Tono;
  /** De qué lado va el disco rojo; los aros van del otro. */
  lado?: Lado;
  /** Suma la lupa del logo como sello, del mismo lado que el disco. */
  lupa?: boolean;
  /** Suma un aro a media altura, para las franjas muy altas. */
  medio?: boolean;
  className?: string;
};

/** El fondo en sí: se pone adentro de un contenedor `relative isolate overflow-hidden`. Ver también `Banda`. */
export function Fondo({ tono, lado = "izq", lupa = false, medio = false, className }: FondoProps) {
  const oscuro = esOscuro(tono);
  const izq = lado === "izq";
  const aro = oscuro ? "border-white/10" : "border-ink/10";

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Color de base con la trama de puntos. */}
      <div className={cn("absolute inset-0", BASE[tono], oscuro ? "trama" : "trama-papel")} />

      {/* Disco rojo plano, cortado por la esquina. */}
      <div
        className={cn(
          "absolute -top-48 size-[36rem] rounded-full md:size-[44rem]",
          izq ? "-left-48" : "-right-48",
          oscuro ? "bg-hunter/20" : tono === "claro" ? "bg-hunter/10" : "bg-hunter/[0.07]",
        )}
      />

      {/* Aros en línea, del lado opuesto. */}
      <div className={cn("absolute -bottom-40 size-[28rem] rounded-full border", izq ? "-right-36" : "-left-36", aro)} />
      <div className={cn("absolute -bottom-72 size-[44rem] rounded-full border", izq ? "-right-64" : "-left-64", aro)} />

      {medio ? (
        <div className={cn("absolute top-1/2 size-[24rem] -translate-y-1/2 rounded-full border", izq ? "-right-40" : "-left-40", aro)} />
      ) : null}

      {lupa ? (
        <LupaSello
          oscuro={oscuro}
          className={cn("-bottom-20 w-[26rem] md:w-[38rem]", izq ? "-left-24" : "-right-24")}
        />
      ) : null}

      {/* El punto rojo, como el mango de la lupa. */}
      <div className={cn("absolute top-12 size-3 rounded-full bg-hunter", izq ? "left-10 md:left-16" : "right-10 md:right-16")} />
    </div>
  );
}

/** Una franja de la página con su fondo. Las secciones de adentro quedan transparentes y se apoyan en este fondo. */
export function Banda({
  tono,
  lado,
  lupa,
  medio,
  className,
  children,
}: {
  tono: Tono;
  lado?: Lado;
  lupa?: boolean;
  medio?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", esOscuro(tono) && "text-white", className)}>
      <Fondo tono={tono} lado={lado} lupa={lupa} medio={medio} />
      {children}
    </div>
  );
}

/** Atajos para quienes solo necesitan el fondo (la cabecera de la portada y de las páginas). */
export function FondoNoche({ className, lado = "izq", lupa }: { className?: string; lado?: Lado; lupa?: boolean }) {
  return <Fondo tono="noche" lado={lado} lupa={lupa} className={className} />;
}

export function FondoClaro({ className, lado = "der", lupa }: { className?: string; lado?: Lado; lupa?: boolean }) {
  return <Fondo tono="claro" lado={lado} lupa={lupa} className={className} />;
}
