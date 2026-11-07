import { cn } from "@/lib/cn";
import { MEDIOS_AMIGOS, type MedioAmigo } from "@/lib/marcas";
import { ImagenMarca } from "./FichaMarca";

function Casillero({ medio, enlace, grande }: { medio: MedioAmigo; enlace: string; grande: boolean }) {
  const contenido = (
    <>
      <div className={cn("flex items-center justify-center rounded-xl bg-white px-3 py-2 text-ink ring-1 ring-line", grande ? "h-28" : "h-20")}>
        {medio.logo ? (
          <ImagenMarca marca={{ nombre: medio.nombre, logo: medio.logo }} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-center text-xs font-extrabold uppercase leading-tight tracking-tight sm:text-sm">{medio.nombre}</span>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-ink/60">{medio.tipo}</p>
    </>
  );

  return enlace ? (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${medio.nombre} (${medio.tipo}), se abre en otra pestaña`}
      className="group block transition-transform duration-700 ease-fluid hover:-translate-y-1"
    >
      {contenido}
    </a>
  ) : (
    <div>{contenido}</div>
  );
}

/**
 * Los logos de los medios aliados, cada uno con su enlace. `radioEnlace` es el enlace de la radio cargado en
 * Ajustes (lo usa Radio del Sur). `grande` es para la página de la sección.
 */
export function MediosAmigos({ radioEnlace, grande = false }: { radioEnlace: string; grande?: boolean }) {
  if (MEDIOS_AMIGOS.length === 0) return null;
  return (
    <ul className={cn("grid grid-cols-2 sm:grid-cols-3", grande ? "gap-4 lg:grid-cols-4 xl:grid-cols-5" : "gap-3")}>
      {MEDIOS_AMIGOS.map((m) => (
        <li key={m.nombre}>
          <Casillero medio={m} enlace={m.enlaceDeLaRadio ? radioEnlace : (m.enlace ?? "")} grande={grande} />
        </li>
      ))}
    </ul>
  );
}
