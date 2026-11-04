"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const EASE = [0.32, 0.72, 0, 1] as const;

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distancia en px desde donde sube. */
  y?: number;
  /** Anima al montar en vez de esperar a que entre en pantalla (para lo que ya se ve al cargar). */
  immediate?: boolean;
};

/** Entrada pesada y suave: sube desde abajo, se desenfoca y aparece. */
export function Reveal({ children, className, delay = 0, y = 64, immediate = false }: Props) {
  const from = { opacity: 0, y, filter: "blur(12px)" };
  const to = { opacity: 1, y: 0, filter: "blur(0px)" };
  const transition = { duration: 0.9, ease: EASE, delay };

  return immediate ? (
    <motion.div className={className} initial={from} animate={to} transition={transition}>
      {children}
    </motion.div>
  ) : (
    <motion.div
      className={className}
      initial={from}
      whileInView={to}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

/** Para listas: cada hijo entra uno después del otro. */
export function Stagger({
  children,
  className,
  paso = 0.08,
}: {
  children: React.ReactNode[];
  className?: string;
  paso?: number;
}) {
  return (
    <>
      {children.map((hijo, i) => (
        <Reveal key={i} delay={Math.min(i, 6) * paso} className={cn(className)}>
          {hijo}
        </Reveal>
      ))}
    </>
  );
}
