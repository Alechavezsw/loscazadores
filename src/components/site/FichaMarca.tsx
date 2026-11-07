import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Marca } from "@/lib/marcas";
import { Logo } from "./Brand";

/** El logo de una marca. No dibuja nada si todavía no tiene archivo. */
export function ImagenMarca({ marca, className, decorativa = false }: { marca: Marca; className?: string; decorativa?: boolean }) {
  if (!marca.logo) return null;
  return (
    // Son logos fijos de public/brand: no hace falta el optimizador.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={marca.logo} alt={decorativa ? "" : marca.nombre} loading="lazy" decoding="async" className={className} />
  );
}

/**
 * Un casillero blanco con el logo de la marca, para que se vea bien sea cual sea el color del logo. Si todavía no
 * hay logo, lleva el nombre en letras. Lo que se pase en `detalle` va debajo del casillero.
 */
export function FichaMarca({ marca, className, detalle }: { marca: Marca; className?: string; detalle?: ReactNode }) {
  return (
    <li className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-20 items-center justify-center rounded-xl bg-white px-3 py-2 text-ink">
        {marca.sitio ? (
          <>
            <Logo className="w-28" />
            <span className="sr-only">{marca.nombre}</span>
          </>
        ) : marca.logo ? (
          <ImagenMarca marca={marca} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-center text-xs font-extrabold uppercase leading-tight tracking-tight sm:text-sm">{marca.nombre}</span>
        )}
      </div>
      {detalle}
    </li>
  );
}
