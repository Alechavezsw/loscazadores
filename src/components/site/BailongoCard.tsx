"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, CircleNotch, MusicNotes, Pause, Play } from "@phosphor-icons/react/ssr";
import { registrarAccion } from "@/lib/analitica-cliente";
import { cn } from "@/lib/cn";
import { MARCAS } from "@/lib/marcas";
import { BAILONGO } from "@/lib/programas";
import { enVentana, RADIO } from "@/lib/radio";
import { alSonarOtro, avisarSuena } from "@/lib/radio-bus";
import { ImagenMarca } from "./FichaMarca";

type Estado = "quieto" | "cargando" | "sonando" | "error";

const TEXTO: Record<Estado, string> = {
  quieto: "Tocá para escuchar la radio en vivo",
  cargando: "Conectando…",
  sonando: "Sonando en vivo",
  error: "Sin señal. Tocá para reintentar",
};

const ALTURAS = [0.35, 0.65, 0.3, 0.85, 0.5, 0.7, 0.4, 0.6];

/** El reloj avisa cada pocos segundos y cuando la pestaña vuelve a verse, para marcar «Al aire» justo a la hora. */
function suscribirReloj(avisar: () => void) {
  const t = setInterval(avisar, 15_000);
  document.addEventListener("visibilitychange", avisar);
  return () => {
    clearInterval(t);
    document.removeEventListener("visibilitychange", avisar);
  };
}

/**
 * El espacio de Se Armó el Bailongo: el texto del programa, un reproductor de audio con la señal de Radio del
 * Sur y, si se cargó, el enlace para escuchar la radio en su sitio. Los sábados de 18 a 21 hs marca «Al aire».
 */
export function BailongoCard({ enlace }: { enlace: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const quiere = useRef(false);
  const contada = useRef(false);
  const [estado, setEstado] = useState<Estado>("quieto");
  const alAire = useSyncExternalStore(suscribirReloj, () => enVentana(new Date()), () => false);

  const detener = useCallback(() => {
    quiere.current = false;
    contada.current = false;
    const a = audio.current;
    if (a) {
      a.pause();
      // Soltar la fuente hace que al volver arranque en vivo y no con lo que quedó guardado.
      a.removeAttribute("src");
      a.load();
    }
    setEstado("quieto");
  }, []);

  // Si empieza a sonar el reproductor flotante de los sábados, este se calla.
  useEffect(() => alSonarOtro("bailongo", () => quiere.current && detener()), [detener]);

  async function reproducir() {
    const a = audio.current;
    if (!a) return;
    quiere.current = true;
    setEstado("cargando");
    a.src = RADIO.stream;
    try {
      await a.play();
    } catch (e) {
      // Una carga nueva interrumpe a la anterior: no es un error.
      if (e instanceof DOMException && e.name === "AbortError") return;
      quiere.current = false;
      setEstado("error");
    }
  }

  function alternar() {
    if (estado === "sonando" || estado === "cargando") detener();
    else void reproducir();
  }

  const sonando = estado === "sonando";
  const cargando = estado === "cargando";

  return (
    <article
      aria-label={BAILONGO.nombre}
      className="trama relative flex h-full flex-col overflow-hidden rounded-2xl bg-hunter p-6 text-white md:p-8"
    >
      <MusicNotes
        weight="fill"
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-6 size-72 -rotate-12 text-white/10"
      />

      <audio
        ref={audio}
        preload="none"
        onPlaying={() => {
          setEstado("sonando");
          avisarSuena("bailongo");
          if (!contada.current) {
            contada.current = true;
            registrarAccion("radio-manual");
          }
        }}
        onWaiting={() => quiere.current && setEstado("cargando")}
        onError={() => {
          // Al soltar la fuente a propósito el navegador también avisa de un error: no cuenta.
          if (!audio.current?.getAttribute("src") || !quiere.current) return;
          quiere.current = false;
          setEstado("error");
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ImagenMarca
            marca={MARCAS.radio}
            className="h-12 w-auto max-w-36 shrink-0 rounded-lg bg-white object-contain p-1.5"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-white/85">
            {RADIO.nombre} {RADIO.frecuencia.replace(" MHz", "")} FM
          </p>
        </div>
        {alAire ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-hunter">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
              <span className="relative size-2 rounded-full bg-hunter" />
            </span>
            Al aire
          </span>
        ) : (
          <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/90">
            {BAILONGO.horario}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">{BAILONGO.nombre}</h3>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">{BAILONGO.texto}</p>

      {MARCAS.bailongo.logo ? (
        // El logo (blanco) llena el centro de la tarjeta. El nombre del programa ya está en el título de arriba.
        <div className="mt-6 flex">
          <ImagenMarca marca={MARCAS.bailongo} decorativa className="h-44 w-auto max-w-full object-contain object-left md:h-56" />
        </div>
      ) : (
        // Sin logo: la frecuencia, enorme y apagada, llena el centro y dice dónde se escucha.
        <p aria-hidden className="mt-8 select-none text-8xl font-bold leading-none tracking-tight text-white/20 md:text-9xl">
          101.1<span className="ml-2 text-4xl md:text-5xl">FM</span>
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-8">
        <button
          type="button"
          onClick={alternar}
          aria-label={sonando || cargando ? `Pausar ${RADIO.nombre}` : `Escuchar ${RADIO.nombre} en vivo`}
          className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-6 text-base font-semibold text-hunter transition-all duration-700 ease-fluid hover:bg-white/90 active:scale-[0.98]"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-hunter text-white">
            {cargando ? (
              <CircleNotch weight="bold" className="size-6 animate-spin" aria-hidden />
            ) : sonando ? (
              <Pause weight="fill" className="size-6" aria-hidden />
            ) : (
              <Play weight="fill" className="size-6 translate-x-px" aria-hidden />
            )}
          </span>
          {sonando || cargando ? "Pausar" : "Escuchar en vivo"}
        </button>

        <span aria-hidden className="flex h-6 items-end gap-[3px]">
          {ALTURAS.map((alto, i) => (
            <span
              key={i}
              className={cn("h-full w-[3px] origin-bottom rounded-full bg-white", sonando && "eq-barra")}
              style={{
                transform: sonando ? undefined : `scaleY(${alto * 0.5})`,
                animationDelay: `${i * 0.12}s`,
                animationDuration: `${0.75 + (i % 3) * 0.22}s`,
              }}
            />
          ))}
        </span>

        {enlace ? (
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-base font-semibold underline underline-offset-4 transition-opacity duration-700 ease-fluid hover:opacity-80"
          >
            Escuchar en el sitio de la radio
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-4 text-sm font-medium text-white/85">
        {TEXTO[estado]}
      </p>
    </article>
  );
}
