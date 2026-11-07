"use client";

import { useEffect, useRef, useState } from "react";
import { VideoCamera, WarningCircle } from "@phosphor-icons/react/ssr";
import { descartarVideoSubido } from "@/app/semiton/actions";
import { cn } from "@/lib/cn";
import { srcVideo } from "@/lib/imagen-url";
import { MAX_VIDEO_BD_BYTES, MAX_VIDEO_BYTES, TIPOS_VIDEO, TROZO_VIDEO_BYTES, type ModoVideo } from "@/lib/video-limites";
import { botonSecundario } from "./ui";

const TIPOS: readonly string[] = TIPOS_VIDEO;
const MB = 1024 * 1024;

type Modo = ModoVideo;

/** Manda un trozo. Si se corta la red lo reintenta un par de veces; un error del pedido no se arregla reintentando. */
async function enviarTrozo(url: string, pedazo: Blob, senal: AbortSignal) {
  let motivo = "Se cortó la conexión. Probá de nuevo.";
  for (let intento = 0; intento < 3; intento++) {
    let r: Response;
    try {
      r = await fetch(url, { method: "PUT", body: pedazo, signal: senal });
    } catch (err) {
      if (senal.aborted) throw err; // la persona canceló
      continue; // falló la red: se reintenta
    }
    if (r.ok) return;
    const e = (await r.json().catch(() => ({}))) as { error?: string };
    motivo = e.error ?? "No se pudo subir el video.";
    if (r.status < 500) break;
  }
  throw new Error(motivo);
}

/**
 * Sube a la base de datos de a trozos: cada pedido lleva un pedazo del archivo, porque una función de Vercel no
 * recibe pedidos de más de 4,5 MB. Al final el servidor comprueba que estén todos.
 */
async function subirABd(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  const json = { "Content-Type": "application/json" };
  const inicio = await fetch("/api/videos/db", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ accion: "iniciar", tipo: archivo.type, bytes: archivo.size }),
    signal: senal,
  });
  const abierta = (await inicio.json().catch(() => ({}))) as { nombre?: string; trozo?: number; error?: string };
  if (!inicio.ok || !abierta.nombre) throw new Error(abierta.error ?? "No se pudo preparar la subida.");

  const trozo = abierta.trozo ?? TROZO_VIDEO_BYTES;
  const total = Math.ceil(archivo.size / trozo);
  for (let n = 0; n < total; n++) {
    await enviarTrozo(`/api/videos/db?nombre=${encodeURIComponent(abierta.nombre)}&n=${n}`, archivo.slice(n * trozo, (n + 1) * trozo), senal);
    onProgreso(((n + 1) / total) * 100);
  }

  const fin = await fetch("/api/videos/db", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ accion: "terminar", nombre: abierta.nombre }),
    signal: senal,
  });
  const cerrada = (await fin.json().catch(() => ({}))) as { valor?: string; error?: string };
  if (!fin.ok || !cerrada.valor) throw new Error(cerrada.error ?? "No se pudo terminar la subida.");
  return cerrada.valor;
}

/** Sube directo a Vercel Blob: el permiso lo da /api/videos/blob y el archivo no pasa por nuestro servidor. */
async function subirABlob(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  const { upload } = await import("@vercel/blob/client");
  const limpio = archivo.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80) || "video.mp4";
  const r = await upload(`videos/${limpio}`, archivo, {
    access: "public",
    handleUploadUrl: "/api/videos/blob",
    multipart: true,
    contentType: archivo.type,
    abortSignal: senal,
    onUploadProgress: ({ percentage }) => onProgreso(percentage),
  });
  return r.url;
}

/** Sube al disco del servidor con un pedido PUT, para ver el avance. */
function subirLocal(archivo: File, onProgreso: (n: number) => void, senal: AbortSignal) {
  return new Promise<string>((resolver, fallar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/videos/local");
    xhr.setRequestHeader("Content-Type", archivo.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso((e.loaded / e.total) * 100);
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText) as { valor?: string; error?: string };
        if (xhr.status < 300 && r.valor) resolver(r.valor);
        else fallar(new Error(r.error ?? "No se pudo subir el video."));
      } catch {
        fallar(new Error("No se pudo subir el video."));
      }
    };
    xhr.onerror = () => fallar(new Error("Se cortó la conexión. Probá de nuevo."));
    senal.addEventListener("abort", () => {
      xhr.abort();
      fallar(new DOMException("Cancelado", "AbortError"));
    });
    xhr.send(archivo);
  });
}

type Props = {
  /** Video ya guardado en la noticia, al editar. */
  actual?: string | null;
  modo: Modo;
  error?: string;
  /** Avisa al formulario para que no se pueda enviar mientras el video está subiendo. */
  alCambiarOcupado: (ocupado: boolean) => void;
};

export function VideoCampo({ actual, modo, error, alCambiarOcupado }: Props) {
  const maxMb = Math.round((modo === "bd" ? MAX_VIDEO_BD_BYTES : MAX_VIDEO_BYTES) / MB);
  const [valor, setValor] = useState<string | null>(actual ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [local, setLocal] = useState<string | null>(null);
  const control = useRef<AbortController | null>(null);
  // Videos subidos en esta pantalla y todavía sin guardar con una noticia: si se reemplazan, se borran.
  const subidosAcaSolo = useRef(new Set<string>());

  useEffect(() => () => control.current?.abort(), []);

  function descartarSiEraNuevo(v: string | null) {
    if (v && subidosAcaSolo.current.delete(v)) void descartarVideoSubido(v);
  }

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    if (!TIPOS.includes(archivo.type)) {
      setLocal("Formato no admitido. Subí un MP4 o un WebM.");
      return;
    }
    if (archivo.size > maxMb * MB) {
      setLocal(`El video pesa más de ${maxMb} MB. Para videos largos conviene subirlos a YouTube y pegar el enlace en Incrustar.`);
      return;
    }

    setLocal(null);
    setProgreso(0);
    setSubiendo(true);
    alCambiarOcupado(true);
    const ctl = new AbortController();
    control.current = ctl;
    try {
      const subir = modo === "bd" ? subirABd : modo === "blob" ? subirABlob : subirLocal;
      const nuevo = await subir(archivo, setProgreso, ctl.signal);
      descartarSiEraNuevo(valor);
      subidosAcaSolo.current.add(nuevo);
      setValor(nuevo);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        const msg = err instanceof Error ? err.message : "";
        setLocal(/autorizado/i.test(msg) ? "Tu sesión venció. Volvé a entrar al panel." : msg || "No se pudo subir el video. Probá de nuevo.");
      }
    } finally {
      control.current = null;
      setSubiendo(false);
      alCambiarOcupado(false);
    }
  }

  function quitar() {
    descartarSiEraNuevo(valor);
    setValor(null);
    setLocal(null);
  }

  const mensaje = local ?? error;

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="video" value={valor ?? ""} />

      {subiendo ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-line bg-white p-6 text-center">
          <VideoCamera className="size-8 text-ink/40" aria-hidden />
          <div
            role="progressbar"
            aria-label="Subida del video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
            className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink/10"
          >
            <div className="h-full rounded-full bg-hunter transition-all duration-700 ease-fluid" style={{ width: `${progreso}%` }} />
          </div>
          <p aria-live="polite" className="text-sm font-semibold">
            Subiendo el video… {Math.round(progreso)} %
          </p>
          <button type="button" onClick={() => control.current?.abort()} className={cn(botonSecundario, "px-3 py-1 text-sm")}>
            Cancelar
          </button>
        </div>
      ) : valor ? (
        <div className="flex flex-col gap-2">
          <video
            key={valor}
            src={srcVideo(valor)}
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full rounded-lg bg-ink object-contain"
          >
            Tu navegador no puede mostrar este video.
          </video>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="video-archivo" className={cn(botonSecundario, "cursor-pointer px-3 py-1 text-sm")}>
              Cambiar el video
            </label>
            <button type="button" onClick={quitar} className={cn(botonSecundario, "px-3 py-1 text-sm hover:border-hunter hover:text-hunter")}>
              Quitar el video
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="video-archivo"
          className={cn(
            "flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-white p-6 text-center transition-colors duration-700 ease-fluid hover:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hunter",
            mensaje ? "border-hunter" : "border-line",
          )}
        >
          <VideoCamera className="size-8 text-ink/40" aria-hidden />
          <span className="text-sm font-semibold">Elegí un video</span>
          <span className="text-xs text-ink/60">MP4 (H.264) o WebM, hasta {maxMb} MB</span>
        </label>
      )}

      <input
        id="video-archivo"
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={alElegir}
        disabled={subiendo}
        className="sr-only"
      />

      {mensaje ? (
        <p role="alert" className="flex items-start gap-1 text-xs font-semibold text-hunter">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
          {mensaje}
        </p>
      ) : (
        <p className="text-xs text-ink/60">
          Los videos de iPhone en formato .mov a veces no se ven en todos los navegadores: mejor MP4. Para videos largos, subilos a YouTube y
          pegá el enlace en Incrustar.
        </p>
      )}
    </div>
  );
}
