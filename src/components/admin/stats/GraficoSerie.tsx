"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { compacto, escalaNice, numero } from "./formato";

export type Punto = {
  /** Lo que se lee en el eje: "27 oct" o "14 h". */
  etiqueta: string;
  /** Lo que se lee en el aviso y en la tabla: "martes 27 de octubre" o "De 14 a 15 h". */
  titulo: string;
  valor: number;
  /** Segunda medida, dibujada como línea. Va en el mismo eje: tiene que ser del mismo tipo de cosa. */
  linea?: number | null;
};

type Props = {
  puntos: Punto[];
  /** Nombre de lo que cuentan las columnas ("Vistas de página"). */
  nombre: string;
  /** Nombre de lo que cuenta la línea ("Visitantes"). Si no hay línea, se omite. */
  nombreLinea?: string;
  /** Cuántas marcas del eje X mostrar como máximo. */
  marcasX?: number;
  /** Altura del área de dibujo, en píxeles. */
  alto?: number;
};

/**
 * Columnas (y, si hay, una línea) sobre un solo eje. Pensado con la guía de visualización:
 * columnas de hasta 24 px con la punta redondeada, línea de 2 px, rejilla fina, el aviso aparece al pasar
 * el puntero por cualquier parte de la columna (o con las flechas del teclado) y siempre hay una tabla equivalente.
 */
export function GraficoSerie({ puntos, nombre, nombreLinea, marcasX = 6, alto = 224 }: Props) {
  const [activo, setActivo] = useState<number | null>(null);
  const idLeyenda = useId();
  const hayLinea = Boolean(nombreLinea) && puntos.some((p) => p.linea != null);
  const n = puntos.length;

  const maxDatos = Math.max(0, ...puntos.map((p) => Math.max(p.valor, p.linea ?? 0)));
  const { tope, paso } = escalaNice(maxDatos);
  const marcasY = Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);

  const cadaX = Math.max(1, Math.ceil(n / marcasX));
  const mostrarX = (i: number) => i % cadaX === 0 && (n - 1 - i >= cadaX / 2 || i === n - 1);

  const pct = (v: number) => (tope > 0 ? (v / tope) * 100 : 0);
  const puntosLinea = hayLinea
    ? puntos.map((p, i) => `${i + 0.5},${100 - pct(p.linea ?? 0)}`).join(" ")
    : "";

  const sel = activo !== null ? puntos[activo] : null;
  const lectura = sel
    ? `${sel.titulo}: ${numero(sel.valor)} ${nombre.toLowerCase()}${hayLinea && sel.linea != null ? `, ${numero(sel.linea)} ${nombreLinea!.toLowerCase()}` : ""}`
    : "";

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActivo((a) => {
        const base = a ?? (e.key === "ArrowRight" ? -1 : n);
        return Math.min(n - 1, Math.max(0, base + (e.key === "ArrowRight" ? 1 : -1)));
      });
    } else if (e.key === "Escape") {
      setActivo(null);
    }
  }

  if (n === 0 || maxDatos === 0) {
    return (
      <p className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--viz-grilla)] text-sm text-[var(--viz-tinta-2)]">
        Todavía no hay datos en este período.
      </p>
    );
  }

  // El aviso se pega al borde cuando la columna está cerca de una punta, para que no se salga del gráfico.
  const posicion = sel && activo !== null ? ((activo + 0.5) / n) * 100 : 0;
  const ancla = activo !== null && activo < n * 0.18 ? "0%" : activo !== null && activo > n * 0.82 ? "-100%" : "-50%";

  return (
    <div className="flex flex-col gap-3">
      {hayLinea ? (
        <ul id={idLeyenda} className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--viz-tinta-2)]" aria-label="Leyenda">
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-[var(--viz-serie-1)]" />
            {nombre}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-4 rounded-full bg-[var(--viz-serie-2)]" />
            {nombreLinea}
          </li>
        </ul>
      ) : null}

      <div
        role="group"
        tabIndex={0}
        aria-label={`Gráfico de ${nombre.toLowerCase()}. Usá las flechas para recorrerlo; abajo hay una tabla con los mismos datos.`}
        onKeyDown={alTeclear}
        onBlur={() => setActivo(null)}
        className="viz rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--viz-serie-1)]"
      >
        <div className="flex">
          {/* Eje Y */}
          <div aria-hidden className="relative mr-2 w-9 shrink-0" style={{ height: alto }}>
            {marcasY.map((v) => (
              <span
                key={v}
                className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums leading-none text-[var(--viz-apagado)]"
                style={{ top: `${100 - pct(v)}%` }}
              >
                {compacto(v)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1" style={{ height: alto }} onPointerLeave={() => setActivo(null)}>
            {/* Rejilla: líneas finas y sólidas, apenas distintas del fondo */}
            {marcasY.map((v) => (
              <div
                key={v}
                aria-hidden
                className="absolute inset-x-0 h-px"
                style={{ top: `${100 - pct(v)}%`, background: v === 0 ? "var(--viz-base)" : "var(--viz-grilla)" }}
              />
            ))}

            {/* Columnas. Cada espacio entero es el blanco del puntero, no solo la columna pintada. */}
            <div className="absolute inset-0 flex">
              {puntos.map((p, i) => (
                <div
                  key={i}
                  onPointerEnter={() => setActivo(i)}
                  onPointerMove={() => setActivo(i)}
                  className={cn("relative flex h-full min-w-0 flex-1 items-end justify-center px-px transition-colors duration-300", activo === i && "bg-black/[0.04]")}
                >
                  <div
                    aria-hidden
                    className="w-full max-w-6 rounded-t-[4px] bg-[var(--viz-serie-1)] transition-[filter] duration-300"
                    style={{ height: `${pct(p.valor)}%`, minHeight: p.valor > 0 ? 2 : 0, filter: activo === i ? "brightness(0.88)" : undefined }}
                  />
                </div>
              ))}
            </div>

            {/* Línea */}
            {hayLinea ? (
              <svg aria-hidden viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
                <polyline
                  points={puntosLinea}
                  fill="none"
                  stroke="var(--viz-serie-2)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}

            {/* Marcador del punto activo (o del último, si no hay ninguno): 10 px con aro de 2 px del color del fondo */}
            {hayLinea
              ? (() => {
                  const i = activo ?? n - 1;
                  const v = puntos[i]?.linea;
                  if (v == null) return null;
                  return (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--viz-superficie)] bg-[var(--viz-serie-2)] box-content"
                      style={{ left: `${((i + 0.5) / n) * 100}%`, top: `${100 - pct(v)}%` }}
                    />
                  );
                })()
              : null}

            {/* Aviso: el valor manda y el nombre acompaña */}
            {sel ? (
              <div
                aria-hidden
                className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-[var(--viz-grilla)] bg-white px-3 py-2 text-xs shadow-lg"
                style={{ left: `${posicion}%`, transform: `translateX(${ancla})` }}
              >
                <p className="font-semibold text-[var(--viz-tinta)]">{sel.titulo}</p>
                <p className="mt-1 flex items-center justify-between gap-4 text-[var(--viz-tinta-2)]">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--viz-serie-1)]" />
                    {nombre}
                  </span>
                  <strong className="tabular-nums text-[var(--viz-tinta)]">{numero(sel.valor)}</strong>
                </p>
                {hayLinea && sel.linea != null ? (
                  <p className="mt-0.5 flex items-center justify-between gap-4 text-[var(--viz-tinta-2)]">
                    <span className="flex items-center gap-2">
                      <span className="h-0.5 w-2.5 rounded-full bg-[var(--viz-serie-2)]" />
                      {nombreLinea}
                    </span>
                    <strong className="tabular-nums text-[var(--viz-tinta)]">{numero(sel.linea)}</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Eje X */}
        <div aria-hidden className="relative ml-11 mt-1.5 h-4">
          {puntos.map((p, i) =>
            mostrarX(i) ? (
              <span
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-[var(--viz-apagado)]"
                style={{ left: `${((i + 0.5) / n) * 100}%` }}
              >
                {p.etiqueta}
              </span>
            ) : null,
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {lectura}
      </p>

      <details className="group text-sm">
        <summary className="inline-flex cursor-pointer select-none items-center gap-1 rounded-md text-xs font-semibold text-[var(--viz-tinta-2)] underline-offset-2 hover:text-[var(--viz-tinta)] hover:underline">
          Ver como tabla
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-[var(--viz-grilla)]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white text-[var(--viz-tinta-2)]">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {puntos[0]?.etiqueta.endsWith(" h") ? "Hora" : "Día"}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  {nombre}
                </th>
                {hayLinea ? (
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    {nombreLinea}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {puntos.map((p, i) => (
                <tr key={i} className="border-t border-[var(--viz-grilla)]">
                  <th scope="row" className="px-3 py-1.5 font-normal text-[var(--viz-tinta-2)]">
                    {p.titulo}
                  </th>
                  <td className="px-3 py-1.5 text-right tabular-nums">{numero(p.valor)}</td>
                  {hayLinea ? <td className="px-3 py-1.5 text-right tabular-nums">{p.linea == null ? "—" : numero(p.linea)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
