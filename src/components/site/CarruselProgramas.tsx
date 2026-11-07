import { cn } from "@/lib/cn";
import { CARRUSEL_PROGRAMAS, type Marca } from "@/lib/marcas";
import { Logo } from "./Brand";
import { ImagenMarca } from "./FichaMarca";

/** Cuántas veces se repite la lista en cada mitad de la cinta, para que sea más ancha que cualquier pantalla. */
const REPETICIONES = 3;

function Casillero({ marca, copia }: { marca: Marca; copia: boolean }) {
  return (
    <li
      aria-hidden={copia || undefined}
      className={cn(
        "flex h-24 w-56 shrink-0 items-center justify-center rounded-2xl px-6 py-3",
        marca.fondo === "rojo" ? "bg-hunter text-white" : "bg-white text-ink",
        // Quien prefiere menos movimiento ve una sola vuelta de la lista, quieta.
        copia && "motion-reduce:hidden",
      )}
    >
      {marca.sitio ? (
        <>
          <Logo className="w-36" />
          {copia ? null : <span className="sr-only">{marca.nombre}</span>}
        </>
      ) : (
        <ImagenMarca marca={marca} decorativa={copia} className="max-h-full max-w-full object-contain" />
      )}
    </li>
  );
}

function Tira({ oculta }: { oculta?: boolean }) {
  return (
    <ul
      aria-hidden={oculta || undefined}
      className={cn("flex shrink-0 gap-4 pr-4 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0", oculta && "motion-reduce:hidden")}
    >
      {Array.from({ length: REPETICIONES }, (_, vuelta) =>
        CARRUSEL_PROGRAMAS.map((m) => <Casillero key={`${vuelta}-${m.nombre}`} marca={m} copia={Boolean(oculta) || vuelta > 0} />),
      )}
    </ul>
  );
}

/**
 * Cinta de logos de los programas que corre sola, de derecha a izquierda, y se frena al apoyar el mouse o el
 * teclado encima. Son dos mitades iguales y la animación corre media cinta, así que al llegar al final vuelve al
 * principio sin salto. Con «reducir movimiento» queda quieta y muestra cada programa una sola vez.
 */
export function CarruselProgramas() {
  if (CARRUSEL_PROGRAMAS.length === 0) return null;

  return (
    <section aria-labelledby="carrusel-titulo" className="group overflow-hidden pb-12 text-white md:pb-16">
      <p
        id="carrusel-titulo"
        className="mx-auto mb-6 max-w-[1440px] px-4 font-mono text-xs uppercase tracking-widest text-white/50 md:px-6"
      >
        Nuestros programas
      </p>
      <div className="[mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
          <Tira />
          <Tira oculta />
        </div>
      </div>
    </section>
  );
}
