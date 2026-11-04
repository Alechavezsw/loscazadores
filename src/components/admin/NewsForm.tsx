"use client";

import { useHidratado } from "@/lib/use-hidratado";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { guardarNoticia, type FormState } from "@/app/admin/actions";
import { CANAL_UI } from "@/components/site/canales";
import { cn } from "@/lib/cn";
import { CANALES, CATEGORIAS, ESPACIO_INFO, ESPACIOS, type Canal, type Noticia } from "@/lib/types";
import { ImagenCampo } from "./ImagenCampo";
import { IncrustarCampo } from "./IncrustarCampo";
import { VideoCampo } from "./VideoCampo";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";

const INICIAL: FormState = { ok: false };

export function NewsForm({ noticia, modoVideo }: { noticia?: Noticia; modoVideo: "blob" | "local" }) {
  const [estado, accion, pendiente] = useActionState(guardarNoticia, INICIAL);
  const [canales, setCanales] = useState<Set<Canal>>(new Set(noticia?.canales ?? []));
  const errores = estado.errores ?? {};
  const hidratado = useHidratado();
  const [subiendoVideo, setSubiendoVideo] = useState(false);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  function alternar(canal: Canal, activo: boolean) {
    setCanales((prev) => {
      const sig = new Set(prev);
      if (activo) sig.add(canal);
      else sig.delete(canal);
      return sig;
    });
  }

  return (
    <form method="post" onSubmit={alEnviar} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {noticia ? <input type="hidden" name="id" value={noticia.id} /> : null}

      <div className={cn(tarjeta, "flex flex-col gap-6")}>
        <Campo id="titulo" etiqueta="Título" error={errores.titulo} ayuda="Corto y directo. Es lo primero que lee el vecino.">
          <input
            id="titulo"
            name="titulo"
            required
            minLength={5}
            maxLength={160}
            defaultValue={noticia?.titulo}
            aria-invalid={errores.titulo ? true : undefined}
            aria-describedby={errores.titulo ? "titulo-error" : "titulo-ayuda"}
            className={input}
          />
        </Campo>

        <Campo id="cuerpo" etiqueta="Texto de la noticia" error={errores.cuerpo} ayuda="Separá los párrafos con una línea en blanco.">
          <textarea
            id="cuerpo"
            name="cuerpo"
            required
            minLength={10}
            maxLength={8000}
            rows={10}
            defaultValue={noticia?.cuerpo}
            aria-invalid={errores.cuerpo ? true : undefined}
            aria-describedby={errores.cuerpo ? "cuerpo-error" : "cuerpo-ayuda"}
            className={cn(input, "resize-y leading-relaxed")}
          />
        </Campo>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Imagen de portada</span>
          <ImagenCampo actual={noticia?.imagen} error={errores.imagen} ayuda="Si no subís ninguna, se usa la portada con la lupa de la marca." />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Video (opcional)</span>
          <VideoCampo actual={noticia?.video} modo={modoVideo} error={errores.video} alCambiarOcupado={setSubiendoVideo} />
        </div>

        <IncrustarCampo valorInicial={(noticia?.incrustados ?? []).join("\n")} error={errores.incrustados} />
      </div>

      <div className="flex flex-col gap-6">
        <div className={cn(tarjeta, "flex flex-col gap-4")}>
          <Campo id="estado" etiqueta="Estado">
            <select id="estado" name="estado" defaultValue={noticia && !noticia.publicada ? "borrador" : "publicada"} className={input}>
              <option value="publicada">Publicada</option>
              <option value="borrador">Borrador (no se ve en el sitio)</option>
            </select>
          </Campo>

          <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
            <select
              id="categoria"
              name="categoria"
              required
              defaultValue={noticia?.categoria ?? "Barrio"}
              aria-invalid={errores.categoria ? true : undefined}
              className={input}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="espacio"
            etiqueta="Espacio de la portada"
            error={errores.espacio}
            ayuda="Si la noticia es de Viva Feria o de Servicios, va a su propio espacio en lugar de las últimas noticias."
          >
            <select id="espacio" name="espacio" defaultValue={noticia?.espacio ?? ""} className={input}>
              <option value="">Ninguno (últimas noticias)</option>
              {ESPACIOS.map((e) => (
                <option key={e} value={e}>
                  {ESPACIO_INFO[e].nombre} – {ESPACIO_INFO[e].subtitulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="zona" etiqueta="Barrio o zona" ayuda="Opcional. Por ejemplo: Chimbas, Rawson, Capital.">
            <input id="zona" name="zona" maxLength={60} defaultValue={noticia?.zona} className={input} />
          </Campo>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold">Cómo se destaca</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="urgente" defaultChecked={noticia?.urgente} className="mt-0.5 size-4 accent-hunter" />
              <span>
                <strong className="font-semibold">Última hora.</strong> Va primero en la cinta roja de titulares.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="destacada" defaultChecked={noticia?.destacada} className="mt-0.5 size-4 accent-hunter" />
              <span>
                <strong className="font-semibold">Destacada.</strong> Ocupa el lugar grande de las últimas noticias.
              </span>
            </label>
          </fieldset>
        </div>

        <fieldset className={cn(tarjeta, "flex flex-col gap-3")}>
          <legend className="sr-only">Redes donde se publicó</legend>
          <div>
            <p className="text-sm font-semibold">Publicada en</p>
            <p className="text-xs text-ink/60">
              Define en qué columna de la portada aparece. Pegá el enlace de la publicación para que el botón la abra.
            </p>
          </div>
          {CANALES.map((c) => {
            const ui = CANAL_UI[c];
            const activo = canales.has(c);
            return (
              <div key={c} className="flex flex-col gap-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-700 ease-fluid has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-hunter",
                    activo ? "border-ink bg-paper" : "border-line hover:border-ink",
                  )}
                >
                  <input
                    type="checkbox"
                    name={`canal_${c}`}
                    checked={activo}
                    onChange={(e) => alternar(c, e.target.checked)}
                    className="size-4 accent-hunter"
                  />
                  <ui.Icono weight="fill" className="size-5" aria-hidden />
                  <span className="text-sm font-semibold">{ui.nombre}</span>
                </label>
                {activo ? (
                  <Campo id={`enlace_${c}`} etiqueta={`Enlace en ${ui.corto} (opcional)`} error={errores[`enlace_${c}`]}>
                    <input
                      id={`enlace_${c}`}
                      name={`enlace_${c}`}
                      inputMode="url"
                      placeholder="https://"
                      defaultValue={noticia?.enlaces[c]}
                      aria-invalid={errores[`enlace_${c}`] ? true : undefined}
                      className={input}
                    />
                  </Campo>
                ) : null}
              </div>
            );
          })}
        </fieldset>

        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendiente || !hidratado || subiendoVideo} className={botonPrimario}>
            {subiendoVideo ? "Esperá, se está subiendo el video…" : pendiente ? "Guardando…" : noticia ? "Guardar cambios" : "Publicar noticia"}
          </button>
          <Link href="/admin/noticias" className={botonSecundario}>
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}
