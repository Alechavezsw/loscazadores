"use client";

import { useState } from "react";
import { CheckCircle, CopySimple, WarningCircle } from "@phosphor-icons/react/ssr";
import { botonSecundario, input } from "./ui";
import { cn } from "@/lib/cn";

/** Campo de solo lectura con botón para copiar. */
export function CopiarCampo({ id, etiqueta, valor }: { id: string; etiqueta: string; valor: string }) {
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    setTimeout(() => setEstado("idle"), 3000);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={valor}
          onFocus={(e) => e.currentTarget.select()}
          spellCheck={false}
          className={cn(input, "min-w-0 font-code text-xs")}
        />
        <button type="button" onClick={copiar} className={cn(botonSecundario, "shrink-0")}>
          <CopySimple className="size-4" aria-hidden />
          Copiar
        </button>
      </div>
      <p aria-live="polite" className="flex min-h-4 items-center gap-1 text-xs">
        {estado === "ok" ? (
          <>
            <CheckCircle weight="fill" className="size-4 text-wa" aria-hidden />
            Copiado
          </>
        ) : estado === "error" ? (
          <>
            <WarningCircle weight="fill" className="size-4 text-hunter" aria-hidden />
            No se pudo copiar. Seleccionalo y copialo a mano.
          </>
        ) : null}
      </p>
    </div>
  );
}
