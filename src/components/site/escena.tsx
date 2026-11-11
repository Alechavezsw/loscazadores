"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/** Piezas que comparten las portadas animadas de las redes (WhatsApp y Facebook). */

export const EASE = [0.32, 0.72, 0, 1] as const;
export const REBOTE = { type: "spring", stiffness: 420, damping: 24, mass: 0.9 } as const;

/**
 * Lleva el paso de una escena que se repite: avanza según la duración de cada paso (en ms),
 * solo mientras la portada está a la vista. Con las animaciones reducidas se queda quieta en el paso `final`.
 */
export function useEscena(pasos: readonly number[], final: number) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { amount: 0.35 });
  const quieto = useReducedMotion() ?? false;
  const [avance, setAvance] = useState(0);

  useEffect(() => {
    if (quieto || !enVista) return;
    const t = setTimeout(() => setAvance((p) => (p + 1) % pasos.length), pasos[avance]);
    return () => clearTimeout(t);
  }, [avance, enVista, quieto, pasos]);

  return { ref, paso: quieto ? final : avance, activo: enVista && !quieto, quieto };
}

/** Algo que entra con rebote desde su esquina y, al sumarse otra cosa, se corre solo para hacerle lugar. */
export function Aparece({
  origen = "0% 100%",
  className,
  children,
}: {
  /** Desde qué esquina crece, como `transform-origin`. */
  origen?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.4, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.35, ease: EASE } }}
      transition={REBOTE}
      style={{ transformOrigin: origen }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Los tres puntitos de «escribiendo…». */
export function Puntos({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-[0.28em]", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-[0.42em] rounded-full bg-black/40"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

/** Los cerros al atardecer, dibujados para no depender de ninguna imagen. `ancho` es la versión apaisada. */
export function Cerros({ ancho = false }: { ancho?: boolean }) {
  const id = ancho ? "cerros-cielo-ancho" : "cerros-cielo";
  return (
    <svg viewBox={ancho ? "0 0 120 40" : "0 0 40 40"} preserveAspectRatio="xMidYMid slice" className="size-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#ff8f5e" />
        </linearGradient>
      </defs>
      <rect width={ancho ? 120 : 40} height="40" fill={`url(#${id})`} />
      {ancho ? (
        <>
          <circle cx="86" cy="14" r="6" fill="#fff6cf" />
          <path d="M-4 40 14 20l9 9 12-17 14 16 10-9 16 14 12-18 17 15 10-8 14 18Z" fill="#a4553a" />
          <path d="M-4 40 8 30l9 6 14-12 16 12 12-8 15 9 13-12 16 11 10-6 14 10Z" fill="#6e3324" />
        </>
      ) : (
        <>
          <circle cx="28" cy="15" r="5.5" fill="#fff6cf" />
          <path d="M-2 40 9 19l7 9 7-13 19 25Z" fill="#a4553a" />
          <path d="M-2 40 6 29l6 6 9-11 21 16Z" fill="#6e3324" />
        </>
      )}
    </svg>
  );
}
