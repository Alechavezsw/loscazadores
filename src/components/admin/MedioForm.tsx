"use client";

import { useHidratado } from "@/lib/use-hidratado";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { guardarMedio, type FormState } from "@/app/semiton/actions";
import { TIPOS_MEDIO, type MedioAmigo } from "@/lib/types";
import { ImagenCampo } from "./ImagenCampo";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";
import { cn } from "@/lib/cn";

const INICIAL: FormState = { ok: false };

/** Sin `medio` crea uno nuevo; con `medio` edita el que ya existe (nombre, tipo, enlace, logo y estado). */
export function MedioForm({ medio }: { medio?: MedioAmigo }) {
  const [estado, accion, pendiente] = useActionState(guardarMedio, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  const hidratado = useHidratado();
  const errores = estado.errores ?? {};
  const editando = Boolean(medio);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  // Cuando se guarda bien un medio nuevo, el formulario queda limpio para cargar el siguiente.
  useEffect(() => {
    if (estado.ok && !editando) form.current?.reset();
  }, [estado, editando]);

  return (
    <form ref={form} method="post" onSubmit={alEnviar} className={cn(tarjeta, "grid gap-6 md:grid-cols-2")}>
      {medio ? <input type="hidden" name="id" value={medio.id} /> : null}

      <div className="flex flex-col gap-4">
        <Campo id="nombre" etiqueta="Nombre del medio" error={errores.nombre}>
          <input
            id="nombre"
            name="nombre"
            maxLength={60}
            defaultValue={medio?.nombre}
            aria-invalid={errores.nombre ? true : undefined}
            className={input}
          />
        </Campo>
        <Campo id="tipo" etiqueta="Qué clase de medio es" error={errores.tipo} ayuda="Se muestra bajo el logo cuando el enlace no es de una red social conocida.">
          <select id="tipo" name="tipo" defaultValue={medio?.tipo ?? "Radio"} className={input}>
            {TIPOS_MEDIO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="enlace" etiqueta="Enlace al tocar el logo (opcional)" error={errores.enlace} ayuda="Su sitio, su Instagram, su Facebook, su canal de YouTube…">
          <input
            id="enlace"
            name="enlace"
            inputMode="url"
            placeholder="https://"
            defaultValue={medio?.enlace}
            aria-invalid={errores.enlace ? true : undefined}
            className={input}
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" defaultChecked={medio ? medio.activo : true} className="size-4 accent-hunter" />
          {editando ? "Mostrar en el sitio" : "Mostrar en el sitio apenas se guarde"}
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Logo (opcional)</span>
          <ImagenCampo
            name="logo"
            actual={medio?.logo}
            error={errores.imagen}
            aspecto="aspect-[3/2]"
            ajuste="contain"
            fondoClaro
            ayuda={
              editando
                ? "Tocá el logo para cambiarlo. Si no elegís otro, se queda el actual. Sin logo se muestra el nombre en letras."
                : "Mejor si es cuadrado o apaisado y con fondo transparente o blanco. Sin logo se muestra el nombre en letras."
            }
          />
        </div>
        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendiente || !hidratado} className={botonPrimario}>
            {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar medio"}
          </button>
          {editando ? (
            <Link href="/semiton/medios-amigos" className={botonSecundario}>
              Cancelar
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
