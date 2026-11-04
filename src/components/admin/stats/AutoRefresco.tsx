"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Vuelve a pedir los números cada tanto mientras el panel está a la vista, sin recargar la pantalla. */
export function AutoRefresco({ cadaSeg = 30 }: { cadaSeg?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, cadaSeg * 1000);
    return () => clearInterval(t);
  }, [router, cadaSeg]);
  return null;
}
