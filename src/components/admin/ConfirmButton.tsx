"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react/ssr";
import { botonPeligro, botonSecundario } from "./ui";
import { cn } from "@/lib/cn";

/**
 * Borrado en dos pasos sin ventanas emergentes: el primer clic pide confirmación
 * en el mismo lugar y el segundo ejecuta la acción del formulario que lo contiene.
 */
export function ConfirmButton({
  etiqueta = "Eliminar",
  pregunta = "¿Eliminar?",
  confirmar = "Sí, eliminar",
  chico = false,
  conIcono = true,
}: {
  etiqueta?: string;
  pregunta?: string;
  confirmar?: string;
  chico?: boolean;
  conIcono?: boolean;
}) {
  const [pidiendo, setPidiendo] = useState(false);
  const tam = chico ? "px-3 py-1 text-sm" : "";

  if (!pidiendo) {
    return (
      <button type="button" onClick={() => setPidiendo(true)} className={cn(botonSecundario, tam, "hover:border-hunter hover:text-hunter")}>
        {conIcono ? <Trash className="size-4" aria-hidden /> : null}
        {etiqueta}
      </button>
    );
  }

  return (
    <span role="group" aria-label={pregunta} className="inline-flex items-center gap-2">
      <span className="text-sm font-semibold">{pregunta}</span>
      <button type="submit" className={cn(botonPeligro, tam)} autoFocus>
        {confirmar}
      </button>
      <button type="button" onClick={() => setPidiendo(false)} className={cn(botonSecundario, tam)}>
        Cancelar
      </button>
    </span>
  );
}
