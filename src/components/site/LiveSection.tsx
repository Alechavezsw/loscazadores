"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { useLive } from "@/components/LiveProvider";

const EASE = [0.32, 0.72, 0, 1] as const;

export function EnVivoInsignia({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-hunter px-3 py-1 text-xs font-bold uppercase tracking-widest text-white ${className}`}
    >
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white" />
        <span className="relative size-2 rounded-full bg-white" />
      </span>
      En vivo
    </span>
  );
}

export function Reproductor({ videoId, titulo, autoplay = true }: { videoId: string; titulo: string; autoplay?: boolean }) {
  return (
    <iframe
      title={titulo}
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1&playsinline=1&rel=0`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className="absolute inset-0 size-full"
    />
  );
}

/** Aparece arriba de todo apenas el canal empieza a transmitir y se retira solo cuando termina. */
export function LiveSection({ canalUrl }: { canalUrl: string }) {
  const { estado } = useLive();
  const en = estado?.live && estado.videoId ? estado : null;

  return (
    <AnimatePresence initial={false}>
      {en ? (
        <motion.section
          key="en-vivo"
          aria-label="Transmisión en vivo"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="overflow-hidden bg-ink text-white"
        >
          <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink-1 shadow-[0_0_0_1px_rgb(225_29_42/0.6),0_0_48px_rgb(225_29_42/0.25)]">
              <Reproductor videoId={en.videoId!} titulo={en.titulo ?? "Los Cazadores de Noticias en vivo"} />
            </div>

            <div className="flex flex-col items-start gap-4">
              <EnVivoInsignia />
              <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {en.titulo ?? "Estamos en vivo"}
              </h2>
              <p className="text-base text-white/70">
                Transmitimos ahora por YouTube. Entrá y seguí la noticia del barrio mientras pasa.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/en-vivo"
                  className="rounded-full bg-white px-6 py-2 text-base font-semibold text-ink transition-all duration-700 ease-fluid hover:bg-white/85 active:scale-[0.98]"
                >
                  Verlo en pantalla grande
                </Link>
                <a
                  href={canalUrl || `https://www.youtube.com/watch?v=${en.videoId}`}
                  data-evento="canal-youtube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/25 px-6 py-2 text-base font-semibold transition-all duration-700 ease-fluid hover:bg-white/10 active:scale-[0.98]"
                >
                  <YoutubeLogo weight="fill" className="size-5" aria-hidden />
                  Abrir en YouTube
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
