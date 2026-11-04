"use client";

import { useActionState } from "react";
import { iniciarSesion, type FormState } from "@/app/admin/actions";
import { botonPrimario, Campo, input, Mensaje } from "./ui";

const INICIAL: FormState = { ok: false };

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, INICIAL);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo id="password" etiqueta="Contraseña">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          aria-invalid={estado.mensaje ? true : undefined}
          className={input}
        />
      </Campo>
      {estado.mensaje ? <Mensaje ok={false}>{estado.mensaje}</Mensaje> : null}
      <button type="submit" disabled={pendiente} className={botonPrimario}>
        {pendiente ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
