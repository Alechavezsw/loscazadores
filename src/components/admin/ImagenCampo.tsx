"use client";

import { useEffect, useRef, useState } from "react";
import { ImageSquare, WarningCircle } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { srcImagen } from "@/lib/imagen-url";
import { MAX_ENVIO_MB, MAX_ORIGINAL_MB, reducirImagen } from "@/lib/subir-medios";

type Props = {
  name?: string;
  /** Imagen ya guardada, para mostrarla al editar. */
  actual?: string | null;
  error?: string;
  ayuda?: string;
  aspecto?: string;
  /** «contain» muestra la foto entera; «cover» la recorta para llenar el recuadro. */
  ajuste?: "cover" | "contain";
  /** Muestra la casilla para quitar la imagen actual. Se apaga donde la imagen es obligatoria. */
  permitirQuitar?: boolean;
};

/** Selector de imagen con vista previa. Si el formulario se reinicia, la vista previa también. */
export function ImagenCampo({ name = "imagen", actual, error, ayuda, aspecto = "aspect-video", ajuste = "cover", permitirQuitar = true }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [local, setLocal] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const alReiniciar = () => {
      setPreview(null);
      setQuitar(false);
      setLocal(null);
    };
    form.addEventListener("reset", alReiniciar);
    return () => form.removeEventListener("reset", alReiniciar);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const original = input.files?.[0];
    if (!original) {
      setPreview(null);
      setLocal(null);
      return;
    }
    if (original.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      input.value = "";
      setPreview(null);
      setLocal(`La imagen pesa más de ${MAX_ORIGINAL_MB} MB. Probá con una más liviana.`);
      return;
    }

    setPreparando(true);
    const f = await reducirImagen(original);
    setPreparando(false);

    if (f.size > MAX_ENVIO_MB * 1024 * 1024) {
      input.value = "";
      setPreview(null);
      setLocal(`La imagen pesa más de ${MAX_ENVIO_MB} MB y no se pudo achicar. Probá con otra.`);
      return;
    }

    // Se reemplaza lo elegido por la versión achicada, que es la que viaja al servidor.
    if (f !== original) {
      try {
        const lista = new DataTransfer();
        lista.items.add(f);
        input.files = lista.files;
      } catch {
        // Si el navegador no deja reemplazarlo, se sube el original.
      }
    }
    setLocal(null);
    setQuitar(false);
    setPreview(URL.createObjectURL(input.files?.[0] ?? f));
  }

  const mostrada = preview ?? (!quitar && actual ? srcImagen(actual) : null);
  const mensaje = local ?? error;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          ref={ref}
          id={name}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={alElegir}
          aria-invalid={mensaje ? true : undefined}
          aria-describedby={mensaje ? `${name}-error` : ayuda ? `${name}-ayuda` : undefined}
          className="peer sr-only"
        />
        <label
          htmlFor={name}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed text-center transition-colors duration-700 ease-fluid peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hunter hover:border-ink",
            ajuste === "contain" ? "bg-ink-1" : "bg-white",
            mensaje ? "border-hunter" : "border-line",
            aspecto,
          )}
        >
          {mostrada ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mostrada} alt="Vista previa de la imagen elegida" className={cn("size-full", ajuste === "contain" ? "object-contain" : "object-cover")} />
              <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <ImageSquare weight="fill" className="size-3.5" aria-hidden />
                {preparando ? "Preparando…" : "Cambiar la foto"}
              </span>
            </>
          ) : (
            <>
              <ImageSquare className="size-8 text-ink/40" aria-hidden />
              <span className="text-sm font-semibold">{preparando ? "Preparando la imagen…" : "Elegí una imagen"}</span>
              <span className="text-xs text-ink/60">JPG, PNG, WebP o AVIF. Se achica sola antes de subirla.</span>
            </>
          )}
        </label>
      </div>

      {permitirQuitar && actual && !preview ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="quitar_imagen"
            checked={quitar}
            onChange={(e) => setQuitar(e.target.checked)}
            className="size-4 accent-hunter"
          />
          Quitar la imagen actual
        </label>
      ) : null}

      {mensaje ? (
        <p id={`${name}-error`} role="alert" className="flex items-start gap-1 text-xs font-semibold text-hunter">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
          {mensaje}
        </p>
      ) : ayuda ? (
        <p id={`${name}-ayuda`} className="text-xs text-ink/60">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
