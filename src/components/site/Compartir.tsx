"use client";

import { useState } from "react";
import { CheckCircle, CopySimple, FacebookLogo, WarningCircle, WhatsappLogo } from "@phosphor-icons/react/ssr";

export function Compartir({ url, titulo }: { url: string; titulo: string }) {
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

  const boton =
    "flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition-all duration-700 ease-fluid hover:border-ink active:scale-[0.98]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-sm font-semibold text-ink/60">Compartir</span>
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
      <span aria-live="polite" className="flex items-center gap-1 text-sm">
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
