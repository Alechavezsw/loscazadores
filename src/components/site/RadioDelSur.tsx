"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CaretDown,
  CaretUp,
  CircleNotch,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerLow,
  SpeakerSlash,
  X,
} from "@phosphor-icons/react/ssr";
import { registrarAccion } from "@/lib/analitica-cliente";
import { cn } from "@/lib/cn";
import { enVentana, HORARIO_RADIO, RADIO, ventanaId } from "@/lib/radio";
import { alSonarOtro, avisarSuena } from "@/lib/radio-bus";
import type { NombreAccion } from "@/lib/stats-acciones";

/**
 * Reproductor de Radio del Sur. Aparece solo los sábados de 18 a 21 hs (hora de San Juan) y arranca la
 * transmisión. Como los navegadores no dejan sonar a una página hasta que la persona toca algo, si el
 * arranque automático es rechazado el reproductor queda llamando a tocar y empieza en el primer clic,
 * tecla o toque de la visita. A las 21 hs baja el volumen de a poco y se va.
 *
 * Con ?radio=vista en la dirección se muestra fuera de horario (sin arrancar solo), para verlo o probarlo.
 */

const CLAVE_CIERRE = "lc-radio-cerrada";
const CLAVE_VOLUMEN = "lc-radio-volumen";
const REINTENTOS = 3;

// ───────────────────────── lo que vive fuera de React ─────────────────────────

/** El reloj avisa cada pocos segundos y cuando la pestaña vuelve a verse, para entrar y salir justo a la hora. */
function suscribirReloj(avisar: () => void) {
  const t = setInterval(avisar, 15_000);
  document.addEventListener("visibilitychange", avisar);
  return () => {
    clearInterval(t);
    document.removeEventListener("visibilitychange", avisar);
  };
}

const oyentes = new Set<() => void>();
const suscribirCambios = (avisar: () => void) => {
  oyentes.add(avisar);
  return () => void oyentes.delete(avisar);
};
const avisarCambios = () => oyentes.forEach((f) => f());

/** Quién cerró el reproductor en esta emisión. Se guarda en la pestaña; en memoria queda de respaldo. */
let cerradaEnMemoria: string | null = null;
let vistaActiva: boolean | null = null;

function leerCerrada() {
  const id = ventanaId(new Date());
  if (cerradaEnMemoria === id) return true;
  try {
    return sessionStorage.getItem(CLAVE_CIERRE) === id;
  } catch {
    return false;
  }
}

function leerVista() {
  vistaActiva ??= new URLSearchParams(location.search).get("radio") === "vista";
  return vistaActiva;
}

function cerrarReproductor(deVista: boolean) {
  if (deVista) {
    vistaActiva = false;
  } else {
    const id = ventanaId(new Date());
    cerradaEnMemoria = id;
    try {
      sessionStorage.setItem(CLAVE_CIERRE, id);
    } catch {
      /* el respaldo en memoria alcanza */
    }
  }
  avisarCambios();
}

function leerVolumen() {
  try {
    const v = Number(localStorage.getItem(CLAVE_VOLUMEN));
    return Number.isFinite(v) && v > 0 ? Math.min(1, v) : 1;
  } catch {
    return 1;
  }
}

// ───────────────────────── componentes ─────────────────────────

type Estado = "quieto" | "cargando" | "reproduciendo" | "pausado" | "bloqueado" | "error";

const TEXTO: Record<Estado, string> = {
  quieto: "Tocá para escuchar",
  cargando: "Conectando…",
  reproduciendo: "Sonando en vivo",
  pausado: "En pausa. Tocá para volver al aire",
  bloqueado: "Tocá para escuchar",
  error: "Sin señal. Tocá para reintentar",
};

const ALTURAS = [0.35, 0.65, 0.3, 0.85, 0.5, 0.7, 0.4];

function Ecualizador({ activo, className }: { activo: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-5 items-end gap-[3px]", className)}>
      {ALTURAS.map((alto, i) => (
        <span
          key={i}
          className={cn("h-full w-[3px] origin-bottom rounded-full bg-hunter", activo && "eq-barra")}
          style={{
            transform: activo ? undefined : `scaleY(${alto * 0.6})`,
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${0.75 + (i % 3) * 0.22}s`,
          }}
        />
      ))}
    </span>
  );
}

/** Disco de vinilo con la etiqueta roja de la marca. Gira mientras suena. */
function Disco({ gira, className }: { gira: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block shrink-0 rounded-full shadow-[0_6px_20px_-4px_rgba(225,29,42,0.5)] motion-reduce:animate-none",
        gira && "animate-[spin_6s_linear_infinite]",
        className,
      )}
      style={{ background: "repeating-radial-gradient(circle at center, #0a0a0a 0 2px, #1e1e1e 2px 4px)" }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 20deg, transparent 0 18%, rgb(255 255 255 / 0.2) 24%, transparent 30% 68%, rgb(255 255 255 / 0.2) 74%, transparent 80%)",
        }}
      />
      <span className="absolute inset-[31%] rounded-full bg-hunter" />
      <span className="absolute inset-[46%] rounded-full bg-ink" />
    </span>
  );
}

function IconoVolumen({ silencio, volumen }: { silencio: boolean; volumen: number }) {
  if (silencio || volumen === 0) return <SpeakerSlash weight="fill" className="size-5" aria-hidden />;
  return volumen < 0.5 ? (
    <SpeakerLow weight="fill" className="size-5" aria-hidden />
  ) : (
    <SpeakerHigh weight="fill" className="size-5" aria-hidden />
  );
}

const botonIcono =
  "flex size-8 items-center justify-center rounded-full text-white/70 transition-all duration-700 ease-fluid hover:bg-white/10 hover:text-white active:scale-[0.96]";

type Props = { auto: boolean; vista: boolean };

function Reproductor({ auto, vista }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const raiz = useRef<HTMLElement>(null);
  const [estado, setEstado] = useState<Estado>("quieto");
  const [minimizada, setMinimizada] = useState(false);
  const [volumen, setVolumen] = useState(leerVolumen);
  const [silencio, setSilencio] = useState(false);
  const [despidiendo, setDespidiendo] = useState(false);

  // Lo que los temporizadores y eventos necesitan leer sin quedar desactualizados.
  const quiere = useRef(false);
  const reintentos = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const desvanecer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const volumenActual = useRef(volumen);
  // Para las estadísticas: cada vez que alguien empieza a escuchar se cuenta una vez, y se anota si la radio
  // arrancó sola (por el horario) o si la persona apretó play.
  const origen = useRef<NombreAccion>("radio-manual");
  const contada = useRef(false);

  useEffect(() => {
    volumenActual.current = volumen;
    const a = audio.current;
    if (a) {
      a.volume = volumen;
      a.muted = silencio;
    }
    try {
      localStorage.setItem(CLAVE_VOLUMEN, String(volumen));
    } catch {
      /* no se recuerda el volumen y listo */
    }
  }, [volumen, silencio]);

  const limpiarTiempos = useCallback(() => {
    clearTimeout(temporizador.current);
    clearInterval(desvanecer.current);
  }, []);

  /** Corta la transmisión y suelta lo descargado, para que al volver arranque en vivo y no con lo que quedó guardado. */
  const detener = useCallback(
    (siguiente: Estado = "pausado") => {
      quiere.current = false;
      contada.current = false;
      limpiarTiempos();
      const a = audio.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
        a.load();
        a.volume = volumenActual.current;
      }
      setEstado(siguiente);
    },
    [limpiarTiempos],
  );

  const reproducir = useCallback(async () => {
    const a = audio.current;
    if (!a) return;
    limpiarTiempos();
    a.volume = volumenActual.current;
    quiere.current = true;
    setDespidiendo(false);
    setEstado("cargando");
    a.src = RADIO.stream;
    try {
      await a.play();
    } catch (e) {
      // Una carga nueva interrumpe a la anterior: no es un error.
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof DOMException && e.name === "NotAllowedError") setEstado("bloqueado");
      else setEstado("error");
    }
  }, [limpiarTiempos]);

  /** A las 21 hs: baja el volumen en unos segundos, avisa y se va. */
  const despedir = useCallback(() => {
    const a = audio.current;
    if (!a || a.paused) {
      detener("quieto");
      return;
    }
    setDespidiendo(true);
    quiere.current = false;
    clearInterval(desvanecer.current);
    const inicial = a.volume;
    let paso = 0;
    desvanecer.current = setInterval(() => {
      paso++;
      a.volume = Math.max(0, inicial * (1 - paso / 20));
      if (paso >= 20) {
        detener("quieto");
        setDespidiendo(false);
      }
    }, 150);
  }, [detener]);

  // Entra el horario: intenta arrancar. Sale el horario (o se cierra el reproductor): se despide.
  useEffect(() => {
    if (!auto) return;
    // El arranque va en un paso aparte para no encadenar un render dentro del efecto.
    const arranque = setTimeout(() => {
      origen.current = "radio-auto";
      void reproducir();
    }, 0);
    return () => {
      clearTimeout(arranque);
      despedir();
    };
  }, [auto, reproducir, despedir]);

  // Si empieza a sonar el reproductor de Se Armó el Bailongo, este se calla.
  useEffect(() => alSonarOtro("flotante", () => quiere.current && detener()), [detener]);

  // Si el navegador no dejó arrancar, el primer gesto de la persona en cualquier parte de la página lo hace.
  useEffect(() => {
    if (estado !== "bloqueado") return;
    const alGesto = (e: Event) => {
      // Lo que se toca dentro del reproductor lo maneja el propio reproductor.
      if (raiz.current?.contains(e.target as Node)) return;
      void reproducir();
    };
    const tipos = ["click", "keydown", "touchend"] as const;
    for (const t of tipos) window.addEventListener(t, alGesto, true);
    return () => {
      for (const t of tipos) window.removeEventListener(t, alGesto, true);
    };
  }, [estado, reproducir]);

  // Controles del celular y de la pantalla de bloqueo.
  useEffect(() => {
    if (estado !== "reproduciendo" || !("mediaSession" in navigator)) return;
    const sesion = navigator.mediaSession;
    sesion.metadata = new MediaMetadata({
      title: `${RADIO.nombre} ${RADIO.frecuencia}`,
      artist: `En vivo desde ${RADIO.ciudad}`,
      album: "Los Cazadores de Noticias",
      artwork: [{ src: "/brand/og.png", sizes: "1200x630", type: "image/png" }],
    });
    sesion.setActionHandler("play", () => void reproducir());
    sesion.setActionHandler("pause", () => detener());
    return () => {
      sesion.setActionHandler("play", null);
      sesion.setActionHandler("pause", null);
    };
  }, [estado, reproducir, detener]);

  useEffect(() => limpiarTiempos, [limpiarTiempos]);

  function alFallar() {
    const a = audio.current;
    // Al soltar la fuente a propósito el navegador también avisa de un error: no cuenta.
    if (!a?.getAttribute("src") || !quiere.current) return;
    if (reintentos.current < REINTENTOS) {
      reintentos.current++;
      setEstado("cargando");
      temporizador.current = setTimeout(() => quiere.current && void reproducir(), 2500 * reintentos.current);
    } else {
      quiere.current = false;
      setEstado("error");
    }
  }

  function alternar() {
    if (estado === "reproduciendo" || estado === "cargando") {
      detener();
    } else {
      reintentos.current = 0;
      origen.current = "radio-manual";
      void reproducir();
    }
  }

  function cerrar() {
    detener("quieto");
    setDespidiendo(false);
    cerrarReproductor(!auto);
  }

  const sonando = estado === "reproduciendo";
  const cargando = estado === "cargando";
  const llamando = estado === "bloqueado" || estado === "quieto";
  const texto = despidiendo ? "Terminó la transmisión de hoy. ¡Gracias por escuchar!" : TEXTO[estado];
  const visible = auto || vista || despidiendo;

  const botonPlay = (chico: boolean) => (
    <button
      type="button"
      onClick={alternar}
      disabled={despidiendo}
      aria-label={sonando || cargando ? `Pausar ${RADIO.nombre}` : `Escuchar ${RADIO.nombre}`}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-white text-ink transition-all duration-700 ease-fluid hover:scale-105 active:scale-[0.96] disabled:opacity-60",
        chico ? "size-10" : "size-14",
      )}
    >
      {llamando && !despidiendo ? (
        <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
      ) : null}
      {cargando ? (
        <CircleNotch weight="bold" className={cn("animate-spin", chico ? "size-5" : "size-7")} aria-hidden />
      ) : sonando ? (
        <Pause weight="fill" className={chico ? "size-5" : "size-7"} aria-hidden />
      ) : (
        <Play weight="fill" className={cn("translate-x-px", chico ? "size-5" : "size-7")} aria-hidden />
      )}
    </button>
  );

  return (
    <>
      <audio
        ref={audio}
        preload="none"
        onPlaying={() => {
          reintentos.current = 0;
          setEstado("reproduciendo");
          avisarSuena("flotante");
          if (!contada.current) {
            contada.current = true;
            registrarAccion(origen.current);
          }
        }}
        onWaiting={() => quiere.current && setEstado("cargando")}
        onStalled={() => quiere.current && setEstado("cargando")}
        onError={alFallar}
      />

      {!visible ? null : minimizada ? (
        <section ref={raiz} role="region" aria-label={`${RADIO.nombre} en vivo`} className="radio-entra fixed bottom-3 right-3 z-30 sm:bottom-6 sm:right-6">
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-ink/90 p-2 pr-3 text-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <Disco gira={sonando} className="size-10" />
            <Ecualizador activo={sonando} />
            {botonPlay(true)}
            <button type="button" onClick={() => setMinimizada(false)} aria-label="Mostrar el reproductor completo" className={botonIcono}>
              <CaretUp weight="bold" className="size-4" aria-hidden />
            </button>
          </div>
          <span className="sr-only" aria-live="polite">
            {texto}
          </span>
        </section>
      ) : (
        <section ref={raiz} role="region" aria-label={`${RADIO.nombre} en vivo`} className="radio-entra fixed inset-x-3 bottom-3 z-30 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-ink/90 p-4 text-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 size-44 rounded-full bg-hunter/30 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span aria-hidden className="relative flex size-2">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
                  <span className="relative size-2 rounded-full bg-hunter" />
                </span>
                Al aire
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setMinimizada(true)} aria-label="Achicar el reproductor" className={botonIcono}>
                  <CaretDown weight="bold" className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={cerrar} aria-label="Cerrar el reproductor" className={botonIcono}>
                  <X weight="bold" className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="relative mt-3 flex items-center gap-4">
              <Disco gira={sonando} className="size-16" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold leading-tight tracking-tight">{RADIO.nombre}</h2>
                <p className="font-mono text-xs uppercase tracking-widest text-white/60">
                  {RADIO.frecuencia} · {RADIO.ciudad}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Ecualizador activo={sonando} className="shrink-0" />
                  <p aria-live="polite" className="text-xs font-semibold leading-snug text-white/80">
                    {texto}
                  </p>
                </div>
              </div>
              {botonPlay(false)}
            </div>

            <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <p className="text-xs text-white/60">{HORARIO_RADIO}</p>
              {/* En el celular el volumen se maneja con los botones del teléfono: el navegador no deja cambiarlo desde acá. */}
              <div className="hidden items-center gap-2 [@media(hover:hover)]:flex">
                <button
                  type="button"
                  onClick={() => setSilencio((s) => !s)}
                  aria-pressed={silencio}
                  aria-label={silencio ? "Quitar el silencio" : "Silenciar"}
                  className={botonIcono}
                >
                  <IconoVolumen silencio={silencio} volumen={volumen} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={silencio ? 0 : volumen}
                  onChange={(e) => {
                    setVolumen(Number(e.target.value));
                    setSilencio(false);
                  }}
                  aria-label="Volumen"
                  className="h-1.5 w-24 cursor-pointer accent-hunter"
                />
              </div>
            </div>

            <div aria-hidden className={cn("absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10", !sonando && "opacity-0")}>
              <div className="h-full w-1/3 animate-scan bg-hunter" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function RadioDelSur() {
  const enHorario = useSyncExternalStore(suscribirReloj, () => enVentana(new Date()), () => false);
  const cerrada = useSyncExternalStore(suscribirCambios, leerCerrada, () => false);
  const vista = useSyncExternalStore(suscribirCambios, leerVista, () => false);

  return <Reproductor auto={enHorario && !cerrada} vista={vista} />;
}
