"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

/** Un haz de luz roja que sigue al puntero por la cabecera, como una linterna de cazador. */
export function MastheadFX() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(50);
  const y = useMotionValue(45);
  const sx = useSpring(x, { stiffness: 60, damping: 22 });
  const sy = useSpring(y, { stiffness: 60, damping: 22 });
  const fondo = useMotionTemplate`radial-gradient(560px circle at ${sx}% ${sy}%, rgb(225 29 42 / 0.24), transparent 70%)`;

  useEffect(() => {
    const padre = ref.current?.parentElement;
    if (!padre) return;
    const mover = (e: PointerEvent) => {
      const r = padre.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width) * 100);
      y.set(((e.clientY - r.top) / r.height) * 100);
    };
    padre.addEventListener("pointermove", mover);
    return () => padre.removeEventListener("pointermove", mover);
  }, [x, y]);

  return <motion.div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: fondo }} />;
}
