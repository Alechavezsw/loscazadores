"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { Mark } from "./Brand";

/**
 * Frase grande que se enciende palabra por palabra a medida que sube por la pantalla.
 * Usa un IntersectionObserver por palabra, sin listener de scroll.
 */
export function TaglineReveal({ etiqueta, texto, className }: { etiqueta: string; texto: string; className?: string }) {
  const contenedor = useRef<HTMLParagraphElement>(null);
  const palabras = texto.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const nodos = Array.from(contenedor.current?.querySelectorAll<HTMLElement>("[data-w]") ?? []);
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          // La zona observada es el 65% superior de la pantalla: una palabra queda encendida
          // mientras esté dentro de esa zona o ya la haya pasado por arriba.
          const encendida = e.isIntersecting || e.boundingClientRect.top < (e.rootBounds?.top ?? 0);
          e.target.setAttribute("data-on", encendida ? "1" : "0");
        }
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0 },
    );
    nodos.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  return (
    <section aria-label={etiqueta} className={cn("relative overflow-hidden bg-ink px-4 py-24 text-white md:px-6", className)}>
      {/* La lupa de la marca, enorme y apenas visible, detrás de la frase. */}
      <Mark mango="#313131" className="pointer-events-none absolute -right-16 top-8 size-96 text-white/5 md:size-128" />
      <div className="relative mx-auto max-w-5xl">
        <p className="mb-6 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-hunter">
          <span aria-hidden className="h-0.5 w-8 bg-hunter" />
          {etiqueta}
        </p>
        <p ref={contenedor} className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          <span className="sr-only">{texto}</span>
          <span aria-hidden>
            {palabras.map((p, i) => (
              <span
                key={i}
                data-w
                data-on="0"
                className="text-white/30 transition-colors duration-700 ease-fluid data-[on='1']:text-white"
              >
                {p}{" "}
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
