"use client";

import { useHidratado } from "@/lib/use-hidratado";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { guardarPieza, type FormState } from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import type { PiezaSC } from "@/lib/types";
import { ImagenCampo } from "./ImagenCampo";
import { IncrustarCampo } from "./IncrustarCampo";
import { VideoCampo } from "./VideoCampo";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";

const INICIAL: FormState = { ok: false };

/** Alta y edición de un video de la sección de videos. */
export function VideoForm({ pieza, modoVideo }: { pieza?: PiezaSC; modoVideo: "blob" | "local" }) {
  const [estado, accion, pendiente] = useActionState(guardarPieza, INICIAL);
  const errores = estado.errores ?? {};
  const hidratado = useHidratado();
  const [subiendoVideo, setSubiendoVideo] = useState(false);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <form method="post" onSubmit={alEnviar} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {pieza ? <input type="hidden" name="id" value={pieza.id} /> : null}

      <div className={cn(tarjeta, "flex flex-col gap-6")}>
        {pieza && pieza.tipo !== "video" ? (
          <Mensaje ok={false}>
            Esto era una nota y la sección ahora es solo de videos, así que no se muestra en el sitio. Si le sumás un video y
            guardás, pasa a ser un video.
          </Mensaje>
        ) : null}

        <Campo id="titulo" etiqueta="Título" error={errores.titulo} ayuda="Corto y directo. Es lo primero que lee el vecino.">
          <input
            id="titulo"
            name="titulo"
            required
            minLength={5}
            maxLength={160}
            defaultValue={pieza?.titulo}
            aria-invalid={errores.titulo ? true : undefined}
            aria-describedby={errores.titulo ? "titulo-error" : "titulo-ayuda"}
            className={input}
          />
        </Campo>

        <Campo id="cuerpo" etiqueta="Bajada del video (opcional)" error={errores.cuerpo} ayuda="Unas líneas para contar de qué se trata.">
          <textarea
            id="cuerpo"
            name="cuerpo"
            maxLength={8000}
            rows={4}
            defaultValue={pieza?.cuerpo}
            aria-invalid={errores.cuerpo ? true : undefined}
            aria-describedby={errores.cuerpo ? "cuerpo-error" : "cuerpo-ayuda"}
            className={cn(input, "resize-y leading-relaxed")}
          />
        </Campo>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Carátula (opcional)</span>
          <ImagenCampo
            actual={pieza?.imagen}
            error={errores.imagen}
            ayuda="Si no subís ninguna, se usa el primer cuadro del video o la miniatura de YouTube."
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Subir el video</span>
          <VideoCampo actual={pieza?.video} modo={modoVideo} error={errores.video} alCambiarOcupado={setSubiendoVideo} />
        </div>

        <IncrustarCampo valorInicial={(pieza?.incrustados ?? []).join("\n")} error={errores.incrustados} />
      </div>

      <div className="flex flex-col gap-6">
        <div className={cn(tarjeta, "flex flex-col gap-4")}>
          <Campo id="estado" etiqueta="Estado">
            <select id="estado" name="estado" defaultValue={pieza && !pieza.publicada ? "borrador" : "publicada"} className={input}>
              <option value="publicada">Publicado</option>
              <option value="borrador">Borrador (no se ve en el sitio)</option>
            </select>
          </Campo>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="destacada" defaultChecked={pieza?.destacada} className="mt-0.5 size-4 accent-hunter" />
            <span>
              <strong className="font-semibold">Video principal.</strong> Es el que se ve grande en la portada. Si no marcás ninguno, se
              usa el más reciente.
            </span>
          </label>
        </div>

        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendiente || !hidratado || subiendoVideo} className={botonPrimario}>
            {subiendoVideo ? "Esperá, se está subiendo el video…" : pendiente ? "Guardando…" : pieza ? "Guardar cambios" : "Publicar video"}
          </button>
          <Link href="/admin/videos" className={botonSecundario}>
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}
