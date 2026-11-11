"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Bell, ChatCircle, FacebookLogo, Heart, ShareFat, ThumbsUp, User } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Mark } from "./Brand";
import { Aparece, Cerros, EASE, Puntos, REBOTE, useEscena } from "./escena";

/**
 * Cuánto dura cada paso de la escena, en ms:
 * 0 fondo solo · 1 entra la publicación · 2 le dan «Me gusta» y suben las reacciones ·
 * 3 comenta un vecino · 4 «escribiendo…» · 5 respuesta del diario · 6 se limpia y vuelve a empezar.
 */
const PASOS = [700, 1300, 1900, 1400, 1500, 3400, 600];
const RESPUESTA = 5;
const SALIDA = 6;

const SOMBRA = "shadow-[0_0.15em_0.6em_rgb(0_0_0/0.25)]";

type Tipo = "gusta" | "encanta";

/** La insignia redonda de una reacción: pulgar azul o corazón rojo. */
function Reaccion({ tipo, className }: { tipo: Tipo; className?: string }) {
  const Icono = tipo === "gusta" ? ThumbsUp : Heart;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white ring-[0.09em] ring-white",
        tipo === "gusta" ? "bg-fb" : "bg-[#f33e58]",
        className,
      )}
    >
      <Icono weight="fill" className="size-[58%]" />
    </span>
  );
}

/** Reacciones que suben flotando, como en una transmisión: dónde arranca cada una, cuándo y qué tan alto llega. */
const FLOTAN: { tipo: Tipo; left: string; demora: number; dura: number; sube: string; deriva: number }[] = [
  { tipo: "gusta", left: "58%", demora: 0, dura: 2.4, sube: "-620%", deriva: 10 },
  { tipo: "encanta", left: "18%", demora: 0.35, dura: 2.8, sube: "-700%", deriva: -8 },
  { tipo: "gusta", left: "38%", demora: 0.8, dura: 2.5, sube: "-560%", deriva: 12 },
  { tipo: "encanta", left: "70%", demora: 1.15, dura: 2.9, sube: "-680%", deriva: -10 },
  { tipo: "gusta", left: "6%", demora: 1.6, dura: 2.6, sube: "-600%", deriva: 8 },
  { tipo: "encanta", left: "46%", demora: 1.95, dura: 2.7, sube: "-640%", deriva: -12 },
];

function Comentario({ avatar, children }: { avatar: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      {avatar}
      <span className={cn("relative rounded-[0.95em] bg-white px-[0.75em] py-[0.42em] text-[0.8em] font-medium leading-tight text-[#050505]", SOMBRA)}>
        {children}
      </span>
    </>
  );
}

function AvatarDiario() {
  return (
    <span className="flex size-[1.6em] shrink-0 items-center justify-center rounded-full bg-ink ring-[0.09em] ring-white">
      <Mark className="size-3/5 text-white" />
    </span>
  );
}

/**
 * Portada animada con los colores de Facebook para las notas sin foto de esa columna:
 * sale la publicación, los vecinos reaccionan y comentan, y el diario les contesta.
 * Todo se mide en `em` sobre el ancho de la portada, así se ve igual en cualquier tamaño.
 */
export function FacebookCover({ etiqueta, className }: { etiqueta?: string; className?: string }) {
  // Con las animaciones reducidas se muestra la escena completa, sin moverse.
  const { ref, paso, activo } = useEscena(PASOS, RESPUESTA);
  const visible = (desde: number) => paso >= desde && paso < SALIDA;
  const gusta = paso >= 2;
  const avisos = paso >= 5 ? 3 : paso >= 3 ? 2 : paso >= 2 ? 1 : 0;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} aria-hidden className={cn("@container relative overflow-hidden bg-fb", className)}>
        <div className="absolute inset-0 flex flex-col text-[4.4cqw] transition-transform duration-700 ease-fluid group-hover:scale-105">
          {/* Fondo: degradé azul, trama de puntos de la marca, un brillo que deriva y el logo de Facebook de marca de agua. */}
          <div className="absolute inset-0 bg-[linear-gradient(140deg,#62adff_0%,#1877f2_34%,#0f5bd0_68%,#0a3d91_100%)]" />
          <div className="trama-fuerte absolute inset-0" />
          <motion.div
            className="absolute -left-[3em] top-[1em] size-[11em] rounded-full bg-[#bfdcff]/45 blur-[2.6em]"
            animate={activo ? { x: [0, 36, 0], y: [0, 22, 0], scale: [1, 1.15, 1] } : { x: 0, y: 0, scale: 1 }}
            transition={{ duration: 9, ease: "easeInOut", repeat: activo ? Infinity : 0 }}
          />
          <motion.div
            className="absolute -right-[1.4em] top-[3.2em] text-white/15"
            animate={activo ? { y: [0, -8, 0], rotate: [12, 7, 12] } : { y: 0, rotate: 12 }}
            transition={{ duration: 7, ease: "easeInOut", repeat: activo ? Infinity : 0 }}
          >
            <FacebookLogo weight="fill" className="size-[9.5em]" />
          </motion.div>

          {/* Cabecera: la página del diario y la campanita, que suma un aviso con cada cosa que pasa. */}
          <div className="relative z-20 flex items-center gap-[0.6em] bg-[#0a3d91]/80 px-[0.8em] py-[0.5em] text-white shadow-[0_0.1em_0.6em_rgb(0_0_0/0.25)] backdrop-blur-sm">
            <span className="flex size-[1.9em] shrink-0 items-center justify-center rounded-full bg-ink">
              <Mark className="size-3/5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[0.25em]">
              <span className="truncate text-[0.82em] font-bold leading-none">Los Cazadores de Noticias</span>
              <span className="text-[0.62em] leading-none text-white/80">Nueva publicación</span>
            </span>
            <span className="relative shrink-0">
              <motion.span
                key={avisos}
                className="block origin-top"
                animate={avisos ? { rotate: [0, -22, 18, -10, 0] } : { rotate: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Bell weight="fill" className="size-[1.35em]" />
              </motion.span>
              <AnimatePresence>
                {avisos ? (
                  <motion.span
                    key={avisos}
                    className="absolute -right-[0.55em] -top-[0.5em] flex size-[1.5em] items-center justify-center rounded-full bg-[#f33e58] text-[0.55em] font-bold leading-none ring-[0.18em] ring-[#0a3d91]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, transition: { duration: 0.15 } }}
                    transition={REBOTE}
                  >
                    {avisos}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </span>
            <FacebookLogo weight="fill" className="size-[1.5em] shrink-0" />
          </div>

          {/* La escena: lo nuevo entra abajo y empuja hacia arriba lo anterior. */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end gap-[0.32em] px-[0.6em] pb-[0.55em]">
            {etiqueta ? (
              <span className="absolute left-1/2 top-[0.55em] z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-[1em] py-[0.4em] text-[0.55em] font-bold uppercase leading-none tracking-widest text-[#0a3d91] shadow-[0_0.2em_0.8em_rgb(0_0_0/0.2)]">
                {etiqueta}
              </span>
            ) : null}

            <AnimatePresence mode="popLayout">
              {visible(1) ? (
                <Aparece key="publicacion" origen="50% 100%" className={cn("overflow-hidden rounded-[0.8em] bg-white text-[#050505]", SOMBRA)}>
                  <span className="relative block h-[3.3em] overflow-hidden">
                    <motion.span
                      className="block size-full"
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1.6, ease: EASE }}
                    >
                      <Cerros ancho />
                    </motion.span>
                  </span>

                  <span className="relative flex h-[1.5em] items-center px-[0.6em]">
                    <AnimatePresence initial={false}>
                      {gusta ? (
                        <motion.span
                          key="reacciones"
                          className="absolute flex items-center"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE }}
                        >
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...REBOTE, delay: 0.1 }}>
                            <Reaccion tipo="gusta" className="size-[0.95em]" />
                          </motion.span>
                          <motion.span className="-ml-[0.22em]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...REBOTE, delay: 0.28 }}>
                            <Reaccion tipo="encanta" className="size-[0.95em]" />
                          </motion.span>
                          <span className="ml-[0.6em] text-[0.6em] leading-none text-[#65676b]">Les gusta a tus vecinos</span>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="vacio"
                          className="absolute text-[0.6em] leading-none text-[#65676b]"
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                          Sé el primero en reaccionar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>

                  <span className="mx-[0.6em] block h-px bg-black/10" />

                  <span className="grid grid-cols-3 py-[0.42em] text-[0.6em] font-semibold leading-none text-[#65676b]">
                    <span className={cn("relative flex items-center justify-center gap-[0.45em] transition-colors duration-300", gusta && "text-fb")}>
                      <motion.span
                        className="block origin-bottom-left"
                        animate={gusta ? { scale: [1, 1.7, 1], rotate: [0, -24, 0] } : { scale: 1, rotate: 0 }}
                        transition={{ duration: 0.55, ease: EASE }}
                      >
                        <ThumbsUp weight={gusta ? "fill" : "regular"} className="size-[1.5em]" />
                      </motion.span>
                      Me gusta
                      {/* El toque: un anillo que se abre donde «aprietan» el botón. */}
                      {gusta ? (
                        <motion.span
                          className="absolute left-1/2 top-1/2 size-[3em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fb/25"
                          initial={{ scale: 0.2, opacity: 1 }}
                          animate={{ scale: 1.6, opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      ) : null}
                    </span>
                    <span className="flex items-center justify-center gap-[0.45em]">
                      <ChatCircle className="size-[1.5em]" />
                      Comentar
                    </span>
                    <span className="flex items-center justify-center gap-[0.45em]">
                      <ShareFat className="size-[1.5em]" />
                      Compartir
                    </span>
                  </span>
                </Aparece>
              ) : null}

              {visible(3) ? (
                <Aparece key="comentario" className="flex items-end gap-[0.4em] self-start">
                  <Comentario
                    avatar={
                      <span className="flex size-[1.6em] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#ffc46b,#ff7a59)] text-white ring-[0.09em] ring-white">
                        <User weight="fill" className="size-3/5" />
                      </span>
                    }
                  >
                    ¡Pasó en mi barrio!
                    {paso >= RESPUESTA ? (
                      <motion.span
                        className="absolute -bottom-[0.45em] -right-[0.55em]"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...REBOTE, delay: 0.5 }}
                      >
                        <Reaccion tipo="encanta" className="size-[1.2em]" />
                      </motion.span>
                    ) : null}
                  </Comentario>
                </Aparece>
              ) : null}

              {paso === 4 ? (
                <Aparece key="puntos" className="ml-[2em] flex items-end gap-[0.4em] self-start">
                  <AvatarDiario />
                  <span className={cn("rounded-[0.95em] bg-white px-[0.7em] py-[0.62em]", SOMBRA)}>
                    <Puntos />
                  </span>
                </Aparece>
              ) : null}

              {paso === RESPUESTA ? (
                <Aparece key="respuesta" className="ml-[2em] flex items-end gap-[0.4em] self-start">
                  <Comentario avatar={<AvatarDiario />}>¡Gracias por avisar!</Comentario>
                </Aparece>
              ) : null}
            </AnimatePresence>

            {/* Las reacciones suben flotando por la derecha mientras dura el «Me gusta». */}
            <AnimatePresence>
              {activo && visible(2) ? (
                <motion.div
                  key="flotan"
                  className="pointer-events-none absolute bottom-[0.4em] right-[0.5em] z-20 h-[1.5em] w-[7em]"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {FLOTAN.map((f, i) => (
                    <motion.span
                      key={i}
                      className="absolute bottom-0 block"
                      style={{ left: f.left }}
                      initial={{ opacity: 0, y: "0%", x: 0, scale: 0.3 }}
                      animate={{ opacity: [0, 1, 1, 0], y: ["0%", "-140%", "-420%", f.sube], x: [0, f.deriva, -f.deriva, f.deriva], scale: [0.3, 1.1, 1, 0.8] }}
                      transition={{ duration: f.dura, ease: "easeOut", delay: f.demora, repeat: Infinity, repeatDelay: 0.3, times: [0, 0.15, 0.7, 1] }}
                    >
                      <Reaccion tipo={f.tipo} className="size-[1.5em] shadow-[0_0.15em_0.5em_rgb(0_0_0/0.3)]" />
                    </motion.span>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
