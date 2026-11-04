"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { LiveStatus } from "@/lib/types";

type Valor = { estado: LiveStatus | null; cargando: boolean };

const Ctx = createContext<Valor>({ estado: null, cargando: true });

export function useLive() {
  return useContext(Ctx);
}

/** Pregunta cada minuto si hay transmisión en YouTube y avisa a toda la página. */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [valor, setValor] = useState<Valor>({ estado: null, cargando: true });

  useEffect(() => {
    let activo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function consultar() {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (res.ok && activo) setValor({ estado: (await res.json()) as LiveStatus, cargando: false });
        else if (activo) setValor((v) => ({ ...v, cargando: false }));
      } catch {
        if (activo) setValor((v) => ({ ...v, cargando: false }));
      }
      if (activo) {
        // Si otra consulta ya dejó un aviso programado, se descarta: tiene que haber uno solo.
        clearTimeout(timer);
        timer = setTimeout(consultar, document.hidden ? 180_000 : 60_000);
      }
    }

    function alVolver() {
      if (!document.hidden) {
        clearTimeout(timer);
        void consultar();
      }
    }

    void consultar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
