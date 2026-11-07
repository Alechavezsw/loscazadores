"use client";

import { useEffect, useState } from "react";

const reloj = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/San_Juan",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function horaActual() {
  const p = Object.fromEntries(reloj.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}:${p.second}`;
}

/**
 * Reloj de San Juan que avanza cada segundo. La hora se lee recién en el navegador: si se lee al armar
 * la página, el build la trata como un valor que cambia y corta la generación.
 */
export function RelojSanJuan({ className }: { className?: string }) {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    const marcar = () => setTexto(horaActual());
    marcar();
    const t = setInterval(marcar, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <time
      dateTime={texto ?? undefined}
      suppressHydrationWarning
      aria-hidden={texto ? undefined : true}
      className={texto ? className : ["invisible", className].filter(Boolean).join(" ")}
    >
      {texto ?? "00:00:00"}
    </time>
  );
}
