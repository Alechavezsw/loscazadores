"use client";

import { useState } from "react";
import { Play } from "@phosphor-icons/react/ssr";
import { TimeAgo } from "@/components/TimeAgo";
import type { VideoCanal } from "@/lib/youtube-canal";

/**
 * El último video del canal de YouTube dentro de su columna de la portada. Al tocar la imagen se reproduce ahí
 * mismo (con sonido, porque lo pidió la persona); el título lleva al video en YouTube.
 */
export function UltimoVideo({ video, lleno = false }: { video: VideoCanal; lleno?: boolean }) {
  const [reproduciendo, setReproduciendo] = useState(false);

  return (
    <>
      <div className={lleno ? "absolute inset-0 overflow-hidden bg-ink-1" : "relative aspect-video overflow-hidden rounded bg-ink-1"}>
        {reproduciendo ? (
          <iframe
            title={video.titulo}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setReproduciendo(true)}
            aria-label={`Reproducir: ${video.titulo}`}
            className="group/media absolute inset-0 block size-full"
          >
            {/* La miniatura hqdefault trae franjas negras arriba y abajo: object-cover las recorta en el cuadro 16:9. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
              Último video
            </span>
            <span
              aria-hidden
              className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-hunter text-white ring-2 ring-white transition-transform duration-700 ease-fluid group-hover/media:scale-110"
            >
              <Play weight="fill" className="size-5" />
            </span>
            {lleno ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-12 text-left text-sm font-bold leading-snug">
                {video.titulo}
              </span>
            ) : null}
          </button>
        )}
      </div>

      {lleno ? null : (
        <>
          <h3 className="text-base font-bold leading-snug">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-700 ease-fluid hover:text-hunter"
            >
              {video.titulo}
            </a>
          </h3>
          <p className="text-sm leading-snug text-ink/70">
            Publicado <TimeAgo iso={video.publicado} />
          </p>
        </>
      )}
    </>
  );
}
