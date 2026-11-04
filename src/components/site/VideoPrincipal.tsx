"use client";

import Link from "next/link";
import { useState } from "react";
import { Play } from "@phosphor-icons/react/ssr";
import type { Reproductor } from "@/lib/reproductor";

/**
 * El video grande: muestra la carátula con un botón de play y, al tocarlo, lo reproduce ahí mismo. Si el video
 * no se puede reproducir en el lugar (Facebook, Instagram, TikTok), el botón lleva a su página.
 */
export function VideoPrincipal({
  portada,
  reproductor,
  href,
  titulo,
}: {
  /** La carátula ya armada en el servidor. */
  portada: React.ReactNode;
  reproductor: Reproductor | null;
  href: string;
  titulo: string;
}) {
  const [andando, setAndando] = useState(false);

  const boton = (
    <span
      aria-hidden
      className="flex size-20 items-center justify-center rounded-full bg-hunter text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-fluid group-hover:scale-110 md:size-24"
    >
      <Play weight="fill" className="size-9 translate-x-0.5 md:size-10" />
    </span>
  );
  const capa = "group absolute inset-0 flex items-center justify-center bg-black/25 transition-colors duration-700 ease-fluid hover:bg-black/10";

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink-1">
      {andando && reproductor ? (
        reproductor.tipo === "archivo" ? (
          <video src={reproductor.src} controls autoPlay playsInline className="absolute inset-0 size-full bg-ink object-contain">
            Tu navegador no puede reproducir este video.
          </video>
        ) : (
          <iframe
            title={reproductor.titulo}
            src={reproductor.src}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        )
      ) : (
        <>
          {portada}
          {reproductor ? (
            <button type="button" onClick={() => setAndando(true)} aria-label={`Reproducir: ${titulo}`} className={capa}>
              {boton}
            </button>
          ) : (
            <Link href={href} aria-label={`Ver el video: ${titulo}`} className={capa}>
              {boton}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
