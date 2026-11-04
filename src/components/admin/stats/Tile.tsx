import { ArrowDown, ArrowUp, Equals } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { porcentaje } from "./formato";

type Props = {
  etiqueta: string;
  valor: string;
  /** Variación contra el período anterior, como fracción (0,12 = sube 12 %). null si no hay con qué comparar. */
  variacion?: number | null;
  /** Nombre del período con el que se compara ("los 7 días anteriores"). */
  contra?: string;
  /** Texto de apoyo cuando no hay variación (por ejemplo "Ayer: 120"). */
  nota?: string;
  /** El número con el que arranca el panel. Hay uno solo por pantalla. */
  principal?: boolean;
  className?: string;
};

/** Variación: flecha, número y palabra. El color nunca va solo. */
function Variacion({ frac, contra }: { frac: number; contra?: string }) {
  const igual = Math.abs(frac) < 0.005;
  const sube = frac > 0;
  const Icono = igual ? Equals : sube ? ArrowUp : ArrowDown;
  const color = igual ? "text-[var(--viz-tinta-2)]" : sube ? "text-[var(--viz-sube)]" : "text-[var(--viz-baja)]";
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--viz-tinta-2)]">
      <span className={cn("flex items-center gap-0.5 font-semibold", color)}>
        <Icono weight="bold" className="size-3.5" aria-hidden />
        <span className="sr-only">{igual ? "Igual" : sube ? "Sube" : "Baja"}</span>
        {igual ? "Sin cambios" : porcentaje(Math.abs(frac))}
      </span>
      {contra ? <span>frente a {contra}</span> : null}
    </p>
  );
}

export function Tile({ etiqueta, valor, variacion, contra, nota, principal = false, className }: Props) {
  return (
    <div className={cn("viz flex flex-col gap-1 rounded-2xl border border-line bg-white p-5", className)}>
      <p className="text-sm font-semibold text-[var(--viz-tinta-2)]">{etiqueta}</p>
      <p className={cn("font-bold tracking-tight text-[var(--viz-tinta)]", principal ? "text-6xl leading-none md:text-7xl" : "text-4xl")}>{valor}</p>
      {variacion != null ? (
        <Variacion frac={variacion} contra={contra} />
      ) : nota ? (
        <p className="text-xs text-[var(--viz-tinta-2)]">{nota}</p>
      ) : null}
    </div>
  );
}
