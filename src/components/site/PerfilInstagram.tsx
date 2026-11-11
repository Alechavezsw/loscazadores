"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** El widget de Instagram no se achica por debajo de este ancho: en una columna más angosta se recortaría. */
const ANCHO_MINIMO = 326;
/** Lo que mide el widget en su ancho mínimo, hasta que Instagram avisa el alto real. */
const ALTO_INICIAL = 422;

/**
 * El perfil de Instagram tal como lo muestra Instagram: la cabecera de la cuenta y la grilla con lo último que
 * se publicó. Es el widget oficial (instagram.com/usuario/embed), así que se actualiza solo y no necesita claves.
 * Si la columna es más angosta que el widget, se lo achica entero para que entre sin recortarse.
 */
export function PerfilInstagram({ usuario, className }: { usuario: string; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const [ancho, setAncho] = useState(0);
  const [alto, setAlto] = useState(ALTO_INICIAL);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Instagram avisa cuánto mide su contenido; con eso el marco queda justo, sin barra de desplazamiento ni hueco.
  useEffect(() => {
    function alMensaje(e: MessageEvent) {
      if (e.origin !== "https://www.instagram.com" || e.source !== marco.current?.contentWindow) return;
      try {
        const dato = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const medida = dato?.type === "MEASURE" ? Number(dato.details?.height) : NaN;
        if (medida > 0) setAlto(Math.ceil(medida));
      } catch {
        // Un mensaje que no es de medida: no hace falta hacer nada.
      }
    }
    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, []);

  const escala = ancho > 0 && ancho < ANCHO_MINIMO ? ancho / ANCHO_MINIMO : 1;

  return (
    <div ref={caja} className={cn("overflow-hidden bg-white", className)} style={{ height: Math.round(alto * escala) }}>
      <iframe
        ref={marco}
        title={`Instagram de @${usuario}`}
        src={`https://www.instagram.com/${usuario}/embed/`}
        loading="lazy"
        scrolling="no"
        className="block max-w-none origin-top-left"
        style={{ width: escala < 1 ? ANCHO_MINIMO : "100%", height: alto, transform: escala < 1 ? `scale(${escala})` : undefined }}
      />
    </div>
  );
}
