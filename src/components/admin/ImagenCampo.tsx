"use client";

import { useEffect, useRef, useState } from "react";
import { ImageSquare, WarningCircle } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { srcImagen } from "@/lib/imagen-url";

/** Lo máximo que se acepta elegir, antes de achicar. */
const MAX_ORIGINAL_MB = 25;
/**
 * Lo máximo que puede viajar al servidor. Vercel corta los pedidos de más de 4,5 MB, así que las fotos
 * se achican en el navegador (una de celular de 8 MB queda en unos 300 KB) antes de enviarlas.
 */
const MAX_ENVIO_MB = 4;
const LADO_MAXIMO = 1600;
const ACHICAR_DESDE = 1_200_000;

/** Achica y pasa a WebP en el navegador. Si algo falla, devuelve el archivo original sin tocar. */
async function reducir(archivo: File): Promise<File> {
  // Los GIF animados no se tocan: al pasarlos por un lienzo perderían el movimiento.
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;
  try {
    const bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bmp.width, bmp.height));
    if (escala === 1 && archivo.size <= ACHICAR_DESDE) {
      bmp.close();
      return archivo;
    }
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bmp.width * escala);
    lienzo.height = Math.round(bmp.height * escala);
    lienzo.getContext("2d")?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/webp", 0.85));
    // Si el navegador no sabe codificar WebP devuelve PNG, que puede pesar más: se queda el original.
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, "")}.webp`, { type: blob.type });
  } catch {
    return archivo;
  }
}

type Props = {
  name?: string;
  /** Imagen ya guardada, para mostrarla al editar. */
  actual?: string | null;
  error?: string;
  ayuda?: string;
  aspecto?: string;
  /** Muestra la casilla para quitar la imagen actual. Se apaga donde la imagen es obligatoria. */
  permitirQuitar?: boolean;
};

/** Selector de imagen con vista previa. Si el formulario se reinicia, la vista previa también. */
export function ImagenCampo({ name = "imagen", actual, error, ayuda, aspecto = "aspect-video", permitirQuitar = true }: Props) {
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
    const f = await reducir(original);
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
            "flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-white text-center transition-colors duration-700 ease-fluid peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hunter hover:border-ink",
            mensaje ? "border-hunter" : "border-line",
            aspecto,
          )}
        >
          {mostrada ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mostrada} alt="Vista previa de la imagen elegida" className="size-full object-cover" />
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
