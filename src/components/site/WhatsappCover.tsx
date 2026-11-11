"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Check, Checks, Play, VideoCamera, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Mark } from "./Brand";
import { Aparece, Cerros, EASE, Puntos, REBOTE, useEscena } from "./escena";

/**
 * Cuánto dura cada paso de la escena, en ms:
 * 0 chat vacío · 1 llegan la foto y el video · 2 nota de voz · 3 texto · 4 todo leído ·
 * 5 «escribiendo…» · 6 respuesta · 7 se limpia el chat y vuelve a empezar.
 */
const PASOS = [700, 1100, 1400, 1100, 900, 1700, 3400, 600];
const RESPUESTA = 6;
const SALIDA = 7;

/** Alturas de las barras de la nota de voz, en porcentaje. */
const ONDA = [35, 60, 45, 80, 100, 70, 50, 85, 60, 40, 75, 95, 55, 35, 65, 85, 45, 70, 50, 30, 55, 40];

type Entrega = "enviado" | "entregado" | "leido";

function Tildes({ estado, claro = false }: { estado: Entrega; claro?: boolean }) {
  const Icono = estado === "enviado" ? Check : Checks;
  return (
    <Icono
      weight="bold"
      className={cn(
        "size-[1.5em] transition-colors duration-500",
        estado === "leido" ? "text-[#53bdeb]" : claro ? "text-white/85" : "text-black/40",
      )}
    />
  );
}

function Hora({ estado, claro = false, className }: { estado?: Entrega; claro?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-[0.25em] text-[0.55em] leading-none", claro ? "text-white" : "text-black/45", className)}>
      11:15
      {estado ? <Tildes estado={estado} claro={claro} /> : null}
    </span>
  );
}

/** Una burbuja del chat: las propias van a la derecha en verde claro, las del diario a la izquierda en blanco. */
function Burbuja({ mia = false, className, children }: { mia?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <Aparece
      origen={mia ? "100% 100%" : "0% 100%"}
      className={cn(
        "relative max-w-[84%] rounded-[0.8em] text-[#111b21] shadow-[0_0.15em_0.6em_rgb(0_0_0/0.22)]",
        mia ? "self-end rounded-br-[0.2em] bg-[#d9fdd3]" : "self-start rounded-bl-[0.2em] bg-white",
        className,
      )}
    >
      {children}
    </Aparece>
  );
}

function Barras({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-full items-center justify-between", className)}>
      {ONDA.map((alto, i) => (
        <span key={i} className="w-[0.17em] rounded-full bg-current" style={{ height: `${alto}%` }} />
      ))}
    </span>
  );
}

/**
 * Portada animada con los colores de WhatsApp para las notas sin foto de esa columna:
 * un vecino manda su foto, su video y un audio, y el diario le contesta.
 * Todo se mide en `em` sobre el ancho de la portada, así se ve igual en cualquier tamaño.
 */
export function WhatsappCover({ etiqueta, className }: { etiqueta?: string; className?: string }) {
  // Con las animaciones reducidas se muestra la conversación completa, sin moverse.
  const { ref, paso, activo, quieto } = useEscena(PASOS, RESPUESTA);
  const visible = (desde: number) => paso >= desde && paso < SALIDA;
  const entrega = (desde: number): Entrega => (paso >= 4 ? "leido" : paso > desde ? "entregado" : "enviado");
  const escribiendo = paso === 5;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} aria-hidden className={cn("@container relative overflow-hidden bg-[#128c7e]", className)}>
        <div className="absolute inset-0 flex flex-col text-[4.4cqw] transition-transform duration-700 ease-fluid group-hover:scale-105">
          {/* Fondo: degradé verde, trama de puntos de la marca, un brillo que deriva y el logo de WhatsApp de marca de agua. */}
          <div className="absolute inset-0 bg-[linear-gradient(140deg,#2fe07a_0%,#1fa855_32%,#128c7e_68%,#075e54_100%)]" />
          <div className="trama-fuerte absolute inset-0" />
          <motion.div
            className="absolute -right-[3em] top-[1em] size-[11em] rounded-full bg-[#b9ffd6]/45 blur-[2.6em]"
            animate={activo ? { x: [0, -36, 0], y: [0, 22, 0], scale: [1, 1.15, 1] } : { x: 0, y: 0, scale: 1 }}
            transition={{ duration: 9, ease: "easeInOut", repeat: activo ? Infinity : 0 }}
          />
          <motion.div
            className="absolute -left-[1.6em] top-[3.4em] text-white/15"
            animate={activo ? { y: [0, -8, 0], rotate: [-12, -7, -12] } : { y: 0, rotate: -12 }}
            transition={{ duration: 7, ease: "easeInOut", repeat: activo ? Infinity : 0 }}
          >
            <WhatsappLogo weight="fill" className="size-[9.5em]" />
          </motion.div>

          {/* Cabecera del chat. */}
          <div className="relative z-20 flex items-center gap-[0.6em] bg-[#054d44]/80 px-[0.8em] py-[0.5em] text-white shadow-[0_0.1em_0.6em_rgb(0_0_0/0.25)] backdrop-blur-sm">
            <span className="relative flex size-[1.9em] shrink-0 items-center justify-center rounded-full bg-ink">
              <Mark className="size-3/5" />
              <span className="absolute -bottom-[0.05em] -right-[0.05em] size-[0.55em] rounded-full bg-[#25d366] ring-[0.12em] ring-[#054d44]">
                {activo ? <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#25d366]" /> : null}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[0.25em]">
              <span className="truncate text-[0.82em] font-bold leading-none">Los Cazadores de Noticias</span>
              <span className="relative block h-[0.65em] text-[0.62em] leading-none text-white/80">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={escribiendo ? "escribiendo" : "en-linea"}
                    className={cn("absolute left-0 top-0 whitespace-nowrap", escribiendo && "font-semibold text-[#9dffc4]")}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {escribiendo ? "escribiendo…" : "en línea"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <WhatsappLogo weight="fill" className="size-[1.5em] shrink-0" />
          </div>

          {/* La conversación: lo nuevo entra abajo y empuja hacia arriba lo anterior. */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end gap-[0.32em] px-[0.6em] pb-[0.55em]">
            {etiqueta ? (
              <span className="absolute left-1/2 top-[0.55em] z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-[1em] py-[0.4em] text-[0.55em] font-bold uppercase leading-none tracking-widest text-[#075e54] shadow-[0_0.2em_0.8em_rgb(0_0_0/0.2)]">
                {etiqueta}
              </span>
            ) : null}

            <AnimatePresence mode="popLayout">
              {visible(1) ? (
                <Burbuja key="album" mia className="flex gap-[0.2em] p-[0.2em]">
                  <motion.span
                    className="block size-[3.9em] overflow-hidden rounded-[0.62em]"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...REBOTE, delay: 0.12 }}
                  >
                    <Cerros />
                  </motion.span>
                  <motion.span
                    className="relative flex size-[3.9em] items-center justify-center overflow-hidden rounded-[0.62em] bg-[linear-gradient(160deg,#33414d,#0b1014)]"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...REBOTE, delay: 0.26 }}
                  >
                    <motion.span
                      className="flex size-[1.4em] items-center justify-center rounded-full bg-white/90 text-[#0b1014]"
                      animate={activo ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                      transition={{ duration: 1.6, ease: "easeInOut", repeat: activo ? Infinity : 0 }}
                    >
                      <Play weight="fill" className="size-[0.75em]" />
                    </motion.span>
                    <span className="absolute left-[0.5em] top-[0.45em] flex items-center gap-[0.3em] text-[0.55em] font-semibold leading-none text-white">
                      <VideoCamera weight="fill" className="size-[1.3em]" />
                      0:24
                    </span>
                    <Hora estado={entrega(1)} claro className="absolute bottom-[0.55em] right-[0.6em]" />
                  </motion.span>
                </Burbuja>
              ) : null}

              {visible(2) ? (
                <Burbuja key="voz" mia className="flex w-[78%] items-center gap-[0.5em] py-[0.4em] pl-[0.45em] pr-[0.6em]">
                  <span className="flex size-[1.7em] shrink-0 items-center justify-center rounded-full bg-wa text-white">
                    <Play weight="fill" className="size-[0.8em]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[0.3em]">
                    <span className="relative block h-[1.15em]">
                      <Barras className="text-black/25" />
                      <motion.span
                        className="absolute inset-0"
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: quieto ? "inset(0 40% 0 0)" : "inset(0 0% 0 0)" }}
                        transition={{ duration: quieto ? 0 : 5.2, ease: "linear", delay: quieto ? 0 : 0.5 }}
                      >
                        <Barras className="text-wa" />
                      </motion.span>
                    </span>
                    <span className="flex items-center justify-between">
                      <span className="text-[0.55em] leading-none text-black/45">0:12</span>
                      <Hora estado={entrega(2)} />
                    </span>
                  </span>
                </Burbuja>
              ) : null}

              {visible(3) ? (
                <Burbuja key="texto" mia className="flex items-end gap-[0.5em] px-[0.65em] py-[0.42em]">
                  <span className="text-[0.8em] font-medium leading-tight">¡Pasó en mi barrio!</span>
                  <Hora estado={entrega(3)} />
                </Burbuja>
              ) : null}

              {escribiendo ? (
                <Burbuja key="puntos" className="px-[0.7em] py-[0.62em]">
                  <Puntos />
                </Burbuja>
              ) : null}

              {paso === RESPUESTA ? (
                <Burbuja key="respuesta" className="flex items-end gap-[0.5em] px-[0.65em] py-[0.42em]">
                  <span className="flex items-center gap-[0.35em] text-[0.8em] font-medium leading-tight">
                    ¡Recibida! La revisamos y sale
                    <Mark className="size-[1.15em] shrink-0" />
                  </span>
                  <Hora />
                </Burbuja>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
