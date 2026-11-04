"use client";

import { useSyncExternalStore } from "react";
import { fechaBreve } from "@/lib/format";

function suscribir(avisar: () => void) {
  const t = setInterval(avisar, 30_000);
  return () => clearInterval(t);
}

function relativo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return fechaBreve(iso);
}

/** Muestra "hace 2 horas" y se mantiene al día. En el servidor muestra la fecha exacta. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const texto = useSyncExternalStore(
    suscribir,
    () => relativo(iso),
    () => fechaBreve(iso),
  );
  return (
    <time dateTime={iso} className={className}>
      {texto}
    </time>
  );
}
