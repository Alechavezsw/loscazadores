import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { tieneVideo } from "@/lib/embeds";
import { cuerpoSinTitulo, resumen } from "@/lib/format";
import type { Noticia } from "@/lib/types";
import { TimeAgo } from "@/components/TimeAgo";
import { BrandCover, Photo, varianteCover } from "./Brand";
import { CANAL_UI } from "./canales";

export function InsigniaVideo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur",
        className,
      )}
    >
      <Play weight="fill" className="size-3" aria-hidden />
      Video
    </span>
  );
}

/** El sello de las notas urgentes: el mismo punto que late en la cinta roja. */
function InsigniaUltimaHora({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex w-max items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-hunter",
        className,
      )}
    >
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
        <span className="relative size-2 rounded-full bg-hunter" />
      </span>
      Última hora
    </span>
  );
}

function Canales({ n, className }: { n: Noticia; className?: string }) {
  if (n.canales.length === 0) return null;
  return (
    <ul className={cn("flex items-center gap-2", className)} aria-label={`Publicada en ${n.canales.map((c) => CANAL_UI[c].corto).join(", ")}`}>
      {n.canales.map((c) => {
        const Icono = CANAL_UI[c].Icono;
        return (
          <li key={c}>
            <Icono weight="fill" className="size-4" aria-hidden />
          </li>
        );
      })}
    </ul>
  );
}

function Etiqueta({ n, sobreOscuro = false }: { n: Noticia; sobreOscuro?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          sobreOscuro ? "bg-hunter text-white" : "bg-ink text-white",
        )}
      >
        {n.categoria}
      </span>
      {n.zona ? (
        <span className={cn("text-xs font-semibold uppercase tracking-wide", sobreOscuro ? "text-white/80" : "text-ink/60")}>
          {n.zona}
        </span>
      ) : null}
    </div>
  );
}

function Portada({ n, className, grande = false }: { n: Noticia; className?: string; grande?: boolean }) {
  return n.imagen ? (
    <Photo
      nombre={n.imagen}
      alt=""
      className={cn("transition-transform duration-700 ease-fluid group-hover:scale-105", className)}
    />
  ) : (
    <BrandCover
      etiqueta={grande ? undefined : n.categoria}
      esquina={grande}
      variante={grande ? "oscuro" : varianteCover(n.id)}
      className="size-full"
    />
  );
}

type Variante = "destacada" | "tarjeta" | "fila" | "ancha";

export function NewsCard({ n, variante = "tarjeta", numero }: { n: Noticia; variante?: Variante; numero?: number }) {
  const href = `/noticias/${n.slug}`;
  const resto = cuerpoSinTitulo(n.titulo, n.cuerpo);
  const video = tieneVideo(n);

  if (variante === "destacada") {
    return (
      <article className="group relative isolate h-full min-h-96 overflow-hidden rounded-2xl bg-ink text-white">
        {video ? <InsigniaVideo className="absolute left-6 top-6 z-10" /> : null}
        <div className="absolute inset-0 -z-10">
          <Portada n={n} grande />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <Link href={href} className="flex h-full min-h-96 flex-col justify-end gap-3 p-6 md:p-8">
          {n.urgente ? <InsigniaUltimaHora /> : null}
          <Etiqueta n={n} sobreOscuro />
          <h3 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-none">{n.titulo}</h3>
          {resto ? <p className="line-clamp-3 max-w-xl text-base text-white/80">{resumen(resto, 220)}</p> : null}
          <div className="flex items-center gap-3 text-xs text-white/70">
            <TimeAgo iso={n.creada} />
            <Canales n={n} />
            <span className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors duration-700 ease-fluid group-hover:bg-hunter group-hover:text-white">
              Leer nota
              <ArrowRight weight="bold" className="size-4" aria-hidden />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  if (variante === "fila") {
    return (
      <article className="group h-full rounded-2xl border border-line bg-white transition-all duration-700 ease-fluid hover:-translate-y-1 hover:shadow-lg">
        <Link href={href} className="flex h-full items-center gap-3 p-3">
          <div className="relative size-24 shrink-0 overflow-hidden rounded">
            <Portada n={n} />
            {video ? (
              <span
                aria-label="Video"
                role="img"
                className="absolute inset-0 m-auto flex size-8 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <Play weight="fill" className="size-4" aria-hidden />
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-hunter">{n.categoria}</p>
            <h3 className="line-clamp-3 text-base font-bold leading-snug">{n.titulo}</h3>
            <TimeAgo iso={n.creada} className="text-xs text-ink/60" />
          </div>
          {numero ? (
            <span
              aria-hidden
              className="shrink-0 self-start pr-2 text-4xl font-bold leading-none tracking-tight text-ink/10 transition-colors duration-700 ease-fluid group-hover:text-hunter"
            >
              {String(numero).padStart(2, "0")}
            </span>
          ) : null}
        </Link>
      </article>
    );
  }

  if (variante === "ancha") {
    return (
      <article className="group h-full overflow-hidden rounded-2xl border border-line bg-white transition-all duration-700 ease-fluid hover:-translate-y-1 hover:shadow-xl">
        <Link href={href} className="grid h-full md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-80">
            <div className="absolute inset-0">
              <Portada n={n} />
            </div>
            {video ? <InsigniaVideo className="absolute left-3 top-3" /> : null}
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <Etiqueta n={n} />
            <h3 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{n.titulo}</h3>
            {resto ? <p className="line-clamp-4 text-base leading-relaxed text-ink/70">{resumen(resto, 240)}</p> : null}
            <div className="flex items-center gap-4 text-xs text-ink/60">
              <TimeAgo iso={n.creada} />
              <Canales n={n} />
            </div>
            <span className="flex w-max items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors duration-700 ease-fluid group-hover:bg-hunter">
              Leer nota
              <ArrowRight weight="bold" className="size-4" aria-hidden />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-700 ease-fluid hover:-translate-y-2 hover:shadow-xl">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Portada n={n} />
          {video ? <InsigniaVideo className="absolute left-3 top-3" /> : null}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 flex size-10 translate-y-2 items-center justify-center rounded-full bg-white text-ink opacity-0 transition-all duration-700 ease-fluid group-hover:translate-y-0 group-hover:bg-hunter group-hover:text-white group-hover:opacity-100"
          >
            <ArrowUpRight weight="bold" className="size-5" />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Etiqueta n={n} />
          <h3 className="text-xl font-bold leading-snug">{n.titulo}</h3>
          {resto ? <p className="line-clamp-3 text-sm leading-snug text-ink/70">{resumen(resto, 160)}</p> : null}
          <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink/60">
            <TimeAgo iso={n.creada} />
            <Canales n={n} />
          </div>
        </div>
      </Link>
    </article>
  );
}
