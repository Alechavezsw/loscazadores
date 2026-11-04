import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { srcImagen } from "@/lib/imagen-url";

/** El logo completo, pintado con el color de texto (o con el reflejo animado si se pide). */
export function Logo({ className, shine = false }: { className?: string; shine?: boolean }) {
  return <div aria-hidden className={cn("logo-mask", shine ? "logo-shine" : "bg-current", className)} />;
}

/** La lupa de la marca. Sirve de avatar y de sello. El mango es rojo, o el color que se pida (sobre rojo va negro). */
export function Mark({ className, mango = "#e11d2a" }: { className?: string; mango?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <circle cx="28" cy="27" r="13.5" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M38.5 38.5 52 52" stroke={mango} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-ink text-white", className ?? "size-10")}
    >
      <Mark className="size-3/5" />
    </span>
  );
}

/** Portada de reemplazo cuando una noticia no tiene foto. */
/** Alterna negro y rojo según el id de la nota, para que las portadas sin foto no se vean todas iguales. */
export function varianteCover(id: string): "oscuro" | "rojo" {
  return id.charCodeAt(id.length - 1) % 3 === 0 ? "rojo" : "oscuro";
}

export function BrandCover({
  etiqueta,
  className,
  esquina = false,
  variante = "oscuro",
}: {
  etiqueta?: string;
  className?: string;
  /** Lleva la lupa arriba a la derecha para dejar libre el texto que va encima. */
  esquina?: boolean;
  variante?: "oscuro" | "rojo";
}) {
  const rojo = variante === "rojo";
  return (
    <div
      aria-hidden
      className={cn("relative flex items-center justify-center overflow-hidden", rojo ? "trama-fuerte bg-hunter" : "trama bg-ink-1", className)}
    >
      <Mark
        mango={rojo ? "#000" : undefined}
        className={cn(
          "min-h-12 min-w-12",
          rojo ? "text-white/60" : "text-white/20",
          esquina ? "absolute right-8 top-8 size-40 md:size-56" : "size-1/3",
        )}
      />
      {etiqueta ? (
        <span className={cn("absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-widest", rojo ? "text-white/90" : "text-white/60")}>
          {etiqueta}
        </span>
      ) : null}
    </div>
  );
}

export function Photo({
  nombre,
  alt,
  className,
  priority = false,
}: {
  nombre: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    // Las fotos ya se reducen y pasan a WebP al subirlas, no hace falta el optimizador.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcImagen(nombre)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

/**
 * Título de sección con estilo de revista: una etiqueta roja arriba, el título grande a la izquierda, un enlace
 * opcional a la derecha y una regla que arranca con un tramo rojo. Toma el color del texto de la sección.
 */
export function SectionTitle({
  id,
  eyebrow,
  action,
  children,
}: {
  id?: string;
  eyebrow?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-3">
          {eyebrow ? (
            <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-hunter">
              <span aria-hidden className="h-0.5 w-8 bg-hunter" />
              {eyebrow}
            </p>
          ) : null}
          <h2 id={id} className="text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl lg:text-6xl">
            {children}
          </h2>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="group flex items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-sm font-semibold transition-all duration-700 ease-fluid hover:border-hunter hover:bg-hunter hover:text-white active:scale-[0.98]"
          >
            {action.label}
            <ArrowRight weight="bold" className="size-4 transition-transform duration-700 ease-fluid group-hover:translate-x-1" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div aria-hidden className="relative mt-6 h-px bg-current/15">
        <span className="absolute left-0 top-1/2 h-0.5 w-24 -translate-y-1/2 bg-hunter" />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-ink/10", className)} />;
}
