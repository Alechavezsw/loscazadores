"use client";

import { useHidratado } from "@/lib/use-hidratado";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { guardarAnuncio, type FormState } from "@/app/admin/actions";
import { SLOT_NOMBRE, SLOTS, type Anuncio } from "@/lib/types";
import { ImagenCampo } from "./ImagenCampo";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";
import { cn } from "@/lib/cn";

const INICIAL: FormState = { ok: false };

/** Sin `anuncio` crea uno nuevo; con `anuncio` edita el que ya existe (foto, nombre, enlace, lugar y estado). */
export function AdForm({ anuncio }: { anuncio?: Anuncio }) {
  const [estado, accion, pendiente] = useActionState(guardarAnuncio, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  const hidratado = useHidratado();
  const errores = estado.errores ?? {};
  const editando = Boolean(anuncio);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  // Cuando se guarda bien un anuncio nuevo, el formulario queda limpio para cargar el siguiente.
  useEffect(() => {
    if (estado.ok && !editando) form.current?.reset();
  }, [estado, editando]);

  return (
    <form ref={form} method="post" onSubmit={alEnviar} className={cn(tarjeta, "grid gap-6 md:grid-cols-2")}>
      {anuncio ? <input type="hidden" name="id" value={anuncio.id} /> : null}

      <div className="flex flex-col gap-4">
        <Campo id="slot" etiqueta="Dónde se muestra" error={errores.slot}>
          <select id="slot" name="slot" defaultValue={anuncio?.slot ?? "promo"} className={input}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_NOMBRE[s]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="titulo" etiqueta="Nombre del anunciante" ayuda="Se usa como texto alternativo de la imagen.">
          <input id="titulo" name="titulo" maxLength={80} defaultValue={anuncio?.titulo} className={input} />
        </Campo>
        <Campo id="enlace" etiqueta="Enlace al tocar el anuncio (opcional)" error={errores.enlace}>
          <input
            id="enlace"
            name="enlace"
            inputMode="url"
            placeholder="https://"
            defaultValue={anuncio?.enlace}
            aria-invalid={errores.enlace ? true : undefined}
            className={input}
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" defaultChecked={anuncio ? anuncio.activo : true} className="size-4 accent-hunter" />
          {editando ? "Mostrar en el sitio" : "Mostrar en el sitio apenas se guarde"}
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{editando ? "Foto del anuncio" : "Imagen"}</span>
          <ImagenCampo
            actual={anuncio?.imagen}
            permitirQuitar={false}
            error={errores.imagen}
            aspecto="aspect-[4/3]"
            ayuda={
              editando
                ? "Tocá la foto para cambiarla por otra. Si no elegís ninguna, se queda la actual."
                : "Lateral: vertical, unos 224 por 800 px. Promociones: horizontal 4:3, unos 800 por 600 px."
            }
          />
        </div>
        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendiente || !hidratado} className={botonPrimario}>
            {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar anuncio"}
          </button>
          {editando ? (
            <Link href="/admin/publicidad" className={botonSecundario}>
              Cancelar
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
