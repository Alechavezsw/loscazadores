"use client";

import Link from "next/link";
import { Play } from "@phosphor-icons/react/ssr";
import { useLive } from "@/components/LiveProvider";
import { cn } from "@/lib/cn";
import { BrandCover, Photo } from "./Brand";
import { EnVivoInsignia } from "./LiveSection";

type Props = {
  imagen: string | null;
  titulo: string;
  categoria: string;
  slug: string | null;
};

/** Zona de imagen de la tarjeta de YouTube. Muestra la transmisión cuando está en el aire. */
export function YoutubeMedia({ imagen, titulo, categoria, slug }: Props) {
  const { estado } = useLive();
  const enVivo = estado?.live && estado.videoId ? estado : null;
  const href = enVivo ? "/en-vivo" : slug ? `/noticias/${slug}` : null;

  const contenido = (
    <div className="relative aspect-video overflow-hidden rounded bg-ink-1">
      {enVivo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${enVivo.videoId}/hqdefault_live.jpg`}
          alt={enVivo.titulo ?? "Transmisión en vivo"}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : imagen ? (
        <Photo nombre={imagen} alt={titulo} />
      ) : (
        <BrandCover etiqueta={categoria} className="size-full" />
      )}
      {enVivo ? <EnVivoInsignia className="absolute left-3 top-3" /> : null}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-hunter text-white transition-transform duration-700 ease-fluid group-hover/media:scale-110",
          !enVivo && !imagen && "opacity-90",
        )}
      >
        <Play weight="fill" className="size-5" />
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="group/media block" aria-label={enVivo ? "Ver la transmisión en vivo" : `Abrir la nota: ${titulo}`}>
      {contenido}
    </Link>
  ) : (
    <div>{contenido}</div>
  );
}
