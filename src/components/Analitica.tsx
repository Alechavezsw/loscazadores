"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { enviarEvento } from "@/lib/analitica-cliente";

/**
 * Estadísticas del sitio, sin cookies. Cuenta cada página que se abre, cuánto tiempo estuvo realmente a la vista,
 * si la persona sigue ahí (un aviso por minuto), los clics marcados con data-evento y los anuncios que se llegaron
 * a ver. No muestra nada. Qué se guarda y qué no está explicado en lib/stats.ts.
 */

const LATIDO_MS = 60_000;
const ANUNCIO_VISIBLE_MS = 1000;

export function Analitica() {
  const pathname = usePathname();
  const ultimaRuta = useRef<string | null>(null);
  const primera = useRef(true);

  // Cada página: una visita, el tiempo leído y el aviso de que sigue ahí.
  useEffect(() => {
    // La visita se cuenta una sola vez por página. En desarrollo React ejecuta los efectos dos veces seguidas
    // (arma, desarma y vuelve a armar): los medidores de más abajo se rearman siempre, la visita no se repite.
    if (ultimaRuta.current !== pathname) {
      ultimaRuta.current = pathname;
      const entrada = primera.current;
      primera.current = false;

      let ref = "";
      if (entrada) {
        try {
          ref = document.referrer ? new URL(document.referrer).hostname : "";
        } catch {
          /* sin sitio de origen */
        }
      }
      const params = new URLSearchParams(location.search);
      enviarEvento({
        t: "v",
        r: pathname,
        ref,
        e: entrada ? 1 : 0,
        u: { s: params.get("utm_source") ?? "", c: params.get("utm_campaign") ?? "" },
      });
    }

    // Tiempo leído: solo corre mientras la pestaña se ve. Cada envío lleva lo nuevo desde el anterior.
    let visibleDesde = document.visibilityState === "visible" ? Date.now() : 0;
    let acumulado = 0;
    let enviado = 0;
    let primeraMedicion = true;
    const medir = () => {
      if (visibleDesde) {
        acumulado += Date.now() - visibleDesde;
        visibleDesde = Date.now();
      }
      const total = Math.floor(acumulado / 1000);
      if (total - enviado >= 1) {
        enviarEvento({ t: "s", r: pathname, seg: total - enviado, n: primeraMedicion ? 1 : 0 });
        enviado = total;
        primeraMedicion = false;
      }
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        medir();
        visibleDesde = 0;
      } else {
        visibleDesde = Date.now();
      }
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("pagehide", medir);

    const latido = setInterval(() => {
      if (document.visibilityState === "visible") enviarEvento({ t: "l", r: pathname });
    }, LATIDO_MS);

    // Anuncios: cuentan como vistos cuando al menos la mitad está en pantalla durante un segundo.
    const vistos = new Set<string>();
    const esperas = new Map<Element, ReturnType<typeof setTimeout>>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const id = (e.target as HTMLElement).dataset.anuncioVista ?? "";
          if (e.isIntersecting) {
            if (vistos.has(id) || esperas.has(e.target)) continue;
            esperas.set(
              e.target,
              setTimeout(() => {
                vistos.add(id);
                esperas.delete(e.target);
                observador.unobserve(e.target);
                enviarEvento({ t: "a", r: pathname, a: "anuncio-vista", ad: id });
              }, ANUNCIO_VISIBLE_MS),
            );
          } else {
            clearTimeout(esperas.get(e.target));
            esperas.delete(e.target);
          }
        }
      },
      { threshold: 0.5 },
    );
    // La página termina de armarse un instante después de que cambia la ruta.
    const buscar = setTimeout(() => {
      document.querySelectorAll("[data-anuncio-vista]").forEach((el) => observador.observe(el));
    }, 600);

    return () => {
      medir();
      clearInterval(latido);
      clearTimeout(buscar);
      esperas.forEach((t) => clearTimeout(t));
      observador.disconnect();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pagehide", medir);
    };
  }, [pathname]);

  // Clics: cualquier cosa con data-evento ("whatsapp", "canal-instagram", "anuncio-clic"…).
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-evento]");
      if (!el) return;
      enviarEvento({ t: "a", r: location.pathname, a: el.dataset.evento, ad: el.dataset.anuncio ?? "" });
    };
    // auxclick es el clic del medio, que abre el enlace en otra pestaña.
    document.addEventListener("click", alClic, true);
    document.addEventListener("auxclick", alClic, true);
    return () => {
      document.removeEventListener("click", alClic, true);
      document.removeEventListener("auxclick", alClic, true);
    };
  }, []);

  return null;
}
