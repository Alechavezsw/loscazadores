import { incrustar } from "@/lib/embeds";
import { srcVideo } from "@/lib/imagen-url";
import type { PiezaSC } from "@/lib/types";
import { idVideoYoutube } from "@/lib/urls";
import { Photo } from "./Brand";

function idYoutubeDe(p: PiezaSC) {
  for (const u of p.incrustados ?? []) {
    if (incrustar(u)?.proveedor === "youtube") return idVideoYoutube(u);
  }
  return null;
}

/** La carátula del video, o su primer cuadro, o la miniatura de YouTube, o un fondo negro con la lupa de la marca. */
export function VideoPortada({ p, className }: { p: PiezaSC; className?: string }) {
  if (p.imagen) {
    return <Photo nombre={p.imagen} alt="" className={className} />;
  }
  if (p.video) {
    return (
      <video
        src={`${srcVideo(p.video)}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        aria-hidden
        tabIndex={-1}
        className={`size-full object-cover ${className ?? ""}`}
      />
    );
  }
  const yt = idYoutubeDe(p);
  if (yt) {
    return (
      // La miniatura de YouTube trae franjas negras arriba y abajo: se agranda un poco para dejarlas fuera.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className={`size-full scale-[1.12] object-cover ${className ?? ""}`}
      />
    );
  }
  return <div aria-hidden className="size-full bg-ink-1" />;
}
