"use client";

import { useState } from "react";
import { CheckCircle, CopySimple, FacebookLogo, WarningCircle, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export function Compartir({
  url,
  titulo,
  oscuro = false,
}: {
  url: string;
  titulo: string;
  /** Para ponerlo sobre un fondo negro: botones translúcidos con letras blancas. */
  oscuro?: boolean;
}) {
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    setTimeout(() => setEstado("idle"), 3000);
  }

  const boton = cn(
    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
    oscuro ? "border-white/20 bg-white/5 text-white hover:border-white hover:bg-white/10" : "border-line bg-white hover:border-ink",
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("mr-2 text-sm font-semibold", oscuro ? "text-white/60" : "text-ink/60")}>Compartir</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`}
        data-evento="compartir-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        className={boton}
      >
        <WhatsappLogo weight="fill" className="size-4" aria-hidden />
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        data-evento="compartir-facebook"
        target="_blank"
        rel="noopener noreferrer"
        className={boton}
      >
        <FacebookLogo weight="fill" className="size-4" aria-hidden />
        Facebook
      </a>
      <button type="button" onClick={copiar} data-evento="compartir-enlace" className={boton}>
        <CopySimple className="size-4" aria-hidden />
        Copiar enlace
      </button>
      <span aria-live="polite" className={cn("flex items-center gap-1 text-sm", oscuro && "text-white/80")}>
        {estado === "ok" ? (
          <>
            <CheckCircle weight="fill" className="size-4 text-hunter" aria-hidden />
            Enlace copiado
          </>
        ) : estado === "error" ? (
          <>
            <WarningCircle weight="fill" className="size-4 text-hunter" aria-hidden />
            No se pudo copiar. Copialo desde la barra del navegador.
          </>
        ) : null}
      </span>
    </div>
  );
}
