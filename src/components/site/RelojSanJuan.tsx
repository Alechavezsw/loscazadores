"use client";

import { useSyncExternalStore } from "react";

const ZONA = "America/Argentina/San_Juan";

const reloj = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function horaActual() {
  const p = Object.fromEntries(reloj.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}:${p.second}`;
}

function suscribir(avisar: () => void) {
  const t = setInterval(avisar, 1000);
  return () => clearInterval(t);
}

/** Reloj de San Juan que avanza cada segundo, sin importar la zona de quien mira. */
export function RelojSanJuan({ className }: { className?: string }) {
  const texto = useSyncExternalStore(suscribir, horaActual, horaActual);
  return (
    <time dateTime={texto} suppressHydrationWarning className={className}>
      {texto}
    </time>
  );
}
