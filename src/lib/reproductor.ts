import { incrustar } from "./embeds";
import { srcVideo } from "./imagen-url";
import type { PiezaSC } from "./types";

/** Cómo se reproduce un video dentro de la misma página, o null si hay que abrir su propia página. */
export type Reproductor =
  | { tipo: "archivo"; src: string }
  | { tipo: "iframe"; src: string; titulo: string };

/**
 * Los videos subidos y los de YouTube o Vimeo se reproducen ahí mismo. Facebook, Instagram y TikTok traen su
 * propio formato (vertical o con altura fija), así que esos se ven en la página del video.
 */
export function reproductorDe(p: PiezaSC): Reproductor | null {
  if (p.video) return { tipo: "archivo", src: srcVideo(p.video) };
  for (const u of p.incrustados ?? []) {
    const e = incrustar(u);
    if (e && e.forma === "video") {
      const sep = e.src.includes("?") ? "&" : "?";
      return { tipo: "iframe", src: `${e.src}${sep}autoplay=1`, titulo: p.titulo };
    }
  }
  return null;
}
