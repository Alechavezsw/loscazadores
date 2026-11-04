"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { useLive } from "@/components/LiveProvider";
import { Skeleton } from "./Brand";
import { EnVivoInsignia, Reproductor } from "./LiveSection";

const EASE = [0.32, 0.72, 0, 1] as const;

type Props = { canalUrl: string; whatsappCanalUrl: string };

export function EnVivoPanel({ canalUrl, whatsappCanalUrl }: Props) {
  const { estado, cargando } = useLive();
  const en = estado?.live && estado.videoId ? estado : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <AnimatePresence mode="wait" initial={false}>
        {cargando && !estado ? (
          <motion.div key="cargando" exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <p role="status" className="mt-4 text-center text-sm text-ink/60">
              Buscando la transmisión…
            </p>
          </motion.div>
        ) : en ? (
          <motion.div
            key="vivo"
            initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink shadow-[0_0_0_1px_rgb(225_29_42/0.6),0_0_48px_rgb(225_29_42/0.25)]">
              <Reproductor videoId={en.videoId!} titulo={en.titulo ?? "Los Cazadores de Noticias en vivo"} />
            </div>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col items-start gap-3">
                <EnVivoInsignia />
                <h2 className="max-w-[680px] text-3xl font-bold leading-tight tracking-tight">
                  {en.titulo ?? "Estamos en vivo"}
                </h2>
              </div>
              <a
                href={canalUrl || `https://www.youtube.com/watch?v=${en.videoId}`}
                data-evento="canal-youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98]"
              >
                <YoutubeLogo weight="fill" className="size-5" aria-hidden />
                Abrir en YouTube
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="apagado"
            initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            // La proporción 16:9 solo desde pantallas medianas: con una altura mínima, en el celular obligaba a ensanchar la tarjeta.
            className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl bg-ink p-8 text-center text-white md:aspect-video"
          >
            <YoutubeLogo weight="fill" className="size-14 text-white/30" aria-hidden />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">No estamos transmitiendo en este momento</h2>
            <p className="max-w-lg text-base text-white/70">
              Cuando salgamos al aire, esta página se actualiza sola y el video empieza a reproducirse. Mientras tanto,
              mirá las últimas noticias acá abajo.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {canalUrl ? (
                <a
                  href={canalUrl}
                  data-evento="canal-youtube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98]"
                >
                  <YoutubeLogo weight="fill" className="size-5" aria-hidden />
                  Suscribite en YouTube
                </a>
              ) : null}
              {whatsappCanalUrl ? (
                <a
                  href={whatsappCanalUrl}
                  data-evento="canal-whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98]"
                >
                  <WhatsappLogo weight="fill" className="size-5" aria-hidden />
                  Recibí el aviso por WhatsApp
                </a>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
