"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Clock, Microphone, TelevisionSimple, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { MARCAS, PROGRAMAS_TOMATE, type Marca } from "@/lib/marcas";
import {
  esProximamente,
  horarioDe,
  PRIMERA_EMISION,
  PROGRAMACION_FRASE,
  programaProximo,
  proximaTomateve,
  TOMATEVE,
} from "@/lib/programas";
import type { LiveStatus } from "@/lib/types";
import { useLive } from "@/components/LiveProvider";
import { Logo } from "./Brand";
import { ImagenMarca } from "./FichaMarca";
import type { VideoCanal } from "@/lib/youtube-canal";
import { EnVivoInsignia, Reproductor } from "./LiveSection";
import { UltimoVideo } from "./UltimoVideo";

/** Un programa de TomateTV: logo, horario, quién conduce y por dónde sale. */
function ProgramaFila({ marca }: { marca: Marca }) {
  const horario = horarioDe(marca.nombre);
  const d = marca.detalle;

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 text-ink">
        {marca.sitio ? (
          <>
            <Logo className="w-14" />
            <span className="sr-only">{marca.nombre}</span>
          </>
        ) : marca.logo ? (
          <ImagenMarca marca={marca} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-center text-[10px] font-extrabold uppercase leading-tight">{marca.nombre}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-tight">{marca.nombre}</p>
        {horario ? (
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hunter px-2.5 py-1 text-xs font-semibold">
              <Clock weight="fill" className="size-3.5" aria-hidden />
              <span className="sr-only">Horario. </span>
              {horario}
            </span>
            {esProximamente(marca.nombre) ? (
              <span className="rounded-full border border-white/25 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80">
                Próximamente
              </span>
            ) : null}
          </p>
        ) : null}
        {d?.conduce && d.conduccion ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-white/75">
            <Microphone weight="fill" className="mt-0.5 size-3.5 shrink-0 text-hunter" aria-hidden />
            <span>
              <span className="sr-only">{d.conduce}. </span>
              {d.conduccion}
            </span>
          </p>
        ) : null}
        {d?.emision ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-white/55">
            <TelevisionSimple weight="fill" className="mt-0.5 size-3.5 shrink-0 text-white/40" aria-hidden />
            <span>
              <span className="sr-only">Emitido por. </span>
              {d.emision}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** El texto de «próxima transmisión» se recalcula cada minuto. En el servidor se muestra el horario fijo. */
function suscribirMinuto(avisar: () => void) {
  const t = setInterval(avisar, 60_000);
  return () => clearInterval(t);
}

/**
 * La transmisión de TOMATEVE en la portada. Mientras el canal está en vivo, el video aparece solo (sin sonido,
 * porque los navegadores no dejan sonar a una página hasta que la persona lo pide) con la insignia EN VIVO.
 * Fuera de horario muestra cuándo vuelve a salir al aire.
 */
export function TomateveCard({
  configurado,
  canalUrl,
  video = null,
}: {
  configurado: boolean;
  canalUrl: string;
  /** El último video subido al canal. Se ve en el cuadro cuando no hay transmisión en vivo. */
  video?: VideoCanal | null;
}) {
  const [estado, setEstado] = useState<LiveStatus | null>(null);
  // Dos lecturas de texto (y no un objeto), porque useSyncExternalStore necesita un valor estable entre lecturas.
  const proxima = useSyncExternalStore(suscribirMinuto, () => proximaTomateve(new Date()), () => PRIMERA_EMISION.cuando);
  const programaSiguiente = useSyncExternalStore(suscribirMinuto, () => programaProximo(new Date()), () => PRIMERA_EMISION.programa);

  // Pregunta cada minuto si el canal está transmitiendo (cada tres si la pestaña no se ve).
  useEffect(() => {
    if (!configurado) return;
    let activo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function consultar() {
      try {
        const res = await fetch("/api/live?canal=tomateve", { cache: "no-store" });
        if (res.ok && activo) setEstado((await res.json()) as LiveStatus);
      } catch {
        /* se conserva el último estado y se vuelve a preguntar */
      }
      if (activo) {
        clearTimeout(timer);
        timer = setTimeout(consultar, document.hidden ? 180_000 : 60_000);
      }
    }

    function alVolver() {
      if (!document.hidden) {
        clearTimeout(timer);
        void consultar();
      }
    }

    void consultar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [configurado]);

  const en = estado?.live && estado.videoId ? estado : null;
  // Si la portada ya muestra arriba esta misma transmisión, acá no arranca sola: no hacen falta dos a la vez.
  const { estado: arriba } = useLive();
  const yaSeVeArriba = Boolean(en && arriba?.live && arriba.videoId === en.videoId);

  return (
    <article aria-label={TOMATEVE.nombre} className="flex h-full flex-col overflow-hidden rounded-2xl bg-ink text-white">
      <header className="trama flex items-center justify-between gap-3 px-5 py-5 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <ImagenMarca
            marca={MARCAS.tomateve}
            decorativa
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="leading-tight">
            <p className="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">{TOMATEVE.nombre}</p>
            <p className="text-sm font-medium text-white/60">Nuestros programas en vivo por YouTube</p>
          </div>
        </div>
        {en ? (
          <EnVivoInsignia />
        ) : (
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/70">
            {proxima}
          </span>
        )}
      </header>

      <div className="relative aspect-video overflow-hidden bg-ink-1">
        {en ? (
          <Reproductor
            videoId={en.videoId!}
            titulo={en.titulo ?? `${TOMATEVE.nombre} en vivo`}
            autoplay={!yaSeVeArriba}
          />
        ) : video ? (
          <UltimoVideo video={video} lleno />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-2 to-ink px-6 text-center">
            <YoutubeLogo weight="fill" className="size-10 text-hunter" aria-hidden />
            <p className="text-xl font-bold md:text-2xl">{programaSiguiente}</p>
            <p className="text-sm text-white/70">
              {configurado ? `Próxima transmisión: ${proxima}` : "Pronto vas a poder verlo desde acá."}
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-1 flex-col gap-4 px-5 py-4 md:px-6">
        <p className="text-sm leading-relaxed text-white/70">
          {en
            ? yaSeVeArriba
              ? "El programa está en vivo. Tocá el video para verlo acá."
              : "Estás viendo el programa en vivo. Empieza sin sonido: tocá el parlante del reproductor para activarlo."
            : video
              ? `${TOMATEVE.nombre} transmite ${PROGRAMACION_FRASE}.`
              : `${TOMATEVE.nombre} transmite ${PROGRAMACION_FRASE}. Cuando empiece, lo vas a ver acá mismo.`}
        </p>
        <div>
          <p id="programas-tomate" className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
            Programas
          </p>
          <ul aria-labelledby="programas-tomate" className="flex flex-col gap-3">
            {PROGRAMAS_TOMATE.map((p) => (
              <ProgramaFila key={p.nombre} marca={p} />
            ))}
          </ul>
        </div>
        {canalUrl ? (
          <a
            href={canalUrl}
            data-evento="canal-youtube"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex w-max items-center gap-2 rounded-full bg-hunter px-5 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98]"
          >
            <YoutubeLogo weight="fill" className="size-5" aria-hidden />
            Ver en YouTube
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        ) : null}
      </footer>
    </article>
  );
}
