"use client";

import { useMemo, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/ssr";
import { MAX_INCRUSTADOS, NOMBRE_PROVEEDOR, leerIncrustados } from "@/lib/embeds";
import { Campo, input } from "./ui";
import { cn } from "@/lib/cn";

/** Una dirección o un código de insertar por línea, con aviso al instante de cuáles se reconocen. */
export function IncrustarCampo({ valorInicial, error }: { valorInicial: string; error?: string }) {
  const [texto, setTexto] = useState(valorInicial);
  const lectura = useMemo(() => leerIncrustados(texto), [texto]);

  return (
    <div className="flex flex-col gap-2">
      <Campo
        id="incrustados"
        etiqueta="Incrustar videos o publicaciones"
        error={error}
        ayuda={`Pegá un enlace por línea, o el código de insertar (iframe). Sirven YouTube, Vimeo, TikTok, Facebook e Instagram. Hasta ${MAX_INCRUSTADOS}.`}
      >
        <textarea
          id="incrustados"
          name="incrustados"
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          spellCheck={false}
          placeholder={"https://www.youtube.com/watch?v=…\nhttps://www.facebook.com/…/videos/…"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "incrustados-error" : "incrustados-ayuda"}
          className={cn(input, "resize-y font-code text-xs")}
        />
      </Campo>

      <div aria-live="polite" className="flex flex-col gap-1 empty:hidden">
        {lectura.validos.map((v) => (
          <p key={v.src} className="flex items-center gap-1 text-xs font-semibold text-[#0f6b35]">
            <CheckCircle weight="fill" className="size-4 shrink-0" aria-hidden />
            {NOMBRE_PROVEEDOR[v.proveedor]}: se va a ver dentro de la nota
          </p>
        ))}
        {lectura.errores.map((e) => (
          <p key={`${e.linea}-${e.texto}`} className="flex items-start gap-1 text-xs font-semibold text-hunter">
            <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
            Línea {e.linea}: no se reconoce “{e.texto}”
          </p>
        ))}
        {lectura.validos.length > MAX_INCRUSTADOS ? (
          <p className="text-xs font-semibold text-hunter">Hay más de {MAX_INCRUSTADOS} enlaces: se pueden incrustar hasta {MAX_INCRUSTADOS}.</p>
        ) : null}
      </div>
    </div>
  );
}
