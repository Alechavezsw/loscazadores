import { cn } from "@/lib/cn";
import { numero, porcentaje } from "./formato";

export type ItemRanking = {
  etiqueta: string;
  valor: number;
  /** Texto chico debajo del nombre (por ejemplo, el tiempo promedio). */
  detalle?: string;
  href?: string;
};

type Props = {
  items: ItemRanking[];
  /** Con esto se calcula el porcentaje de cada fila. Sin esto, se muestra solo el número. */
  total?: number;
  vacio?: string;
  className?: string;
};

/**
 * Lista de barras horizontales. Todas las barras llevan el mismo color (un solo dato, no una escala), el número
 * va a la vista en cada fila y el largo parte siempre de cero.
 */
export function Ranking({ items, total, vacio = "Todavía no hay datos en este período.", className }: Props) {
  if (items.length === 0) return <p className="py-6 text-sm text-[var(--viz-tinta-2)]">{vacio}</p>;
  const max = Math.max(...items.map((i) => i.valor), 1);

  return (
    <ol className={cn("viz flex flex-col gap-3", className)}>
      {items.map((it, i) => {
        const etiqueta = it.href ? (
          <a href={it.href} target="_blank" rel="noopener noreferrer" className="truncate underline-offset-2 hover:underline">
            {it.etiqueta}
          </a>
        ) : (
          <span className="truncate">{it.etiqueta}</span>
        );
        return (
          <li key={`${it.etiqueta}-${i}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="flex min-w-0 flex-col text-[var(--viz-tinta)]">
                {etiqueta}
                {it.detalle ? <span className="truncate text-xs text-[var(--viz-tinta-2)]">{it.detalle}</span> : null}
              </span>
              <span className="shrink-0 tabular-nums text-[var(--viz-tinta)]">
                <strong className="font-semibold">{numero(it.valor)}</strong>
                {total && total > 0 ? <span className="ml-2 text-xs text-[var(--viz-tinta-2)]">{porcentaje(it.valor / total)}</span> : null}
              </span>
            </div>
            <div aria-hidden className="h-1.5 w-full">
              <div className="h-full rounded-[4px] bg-[var(--viz-serie-1)]" style={{ width: `${Math.max(2, (it.valor / max) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
