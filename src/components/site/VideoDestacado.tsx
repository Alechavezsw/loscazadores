import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { resumen } from "@/lib/format";
import { reproductorDe } from "@/lib/reproductor";
import { urlSitio } from "@/lib/sitio";
import type { PiezaSC } from "@/lib/types";
import { TimeAgo } from "@/components/TimeAgo";
import { Compartir } from "./Compartir";
import { VideoPortada } from "./VideoPortada";
import { VideoPrincipal } from "./VideoPrincipal";

/**
 * El video principal: el reproductor grande a la izquierda y, a la derecha, su título y su bajada. Va con
 * letras blancas, para ponerlo sobre un fondo negro. Si se pasa `verTodo`, suma el botón hacia el listado.
 */
export function VideoDestacado({ p, verTodo }: { p: PiezaSC; verTodo?: { href: string; texto: string } }) {
  const href = `/sin-censura/${p.slug}`;
  return (
    <div className="grid gap-8 text-white lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
      <VideoPrincipal portada={<VideoPortada p={p} />} reproductor={reproductorDe(p)} href={href} titulo={p.titulo} />

      <div className="flex flex-col items-start gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-hunter">Video destacado</p>
        <h3 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          <Link href={href} className="transition-colors duration-700 ease-fluid hover:text-white/80">
            {p.titulo}
          </Link>
        </h3>
        {p.cuerpo ? <p className="line-clamp-5 text-base leading-relaxed text-white/70">{resumen(p.cuerpo, 260)}</p> : null}
        <TimeAgo iso={p.creada} className="text-sm text-white/50" />
        {/* Se comparte la dirección propia del video, no la de la página donde está puesto. */}
        <Compartir url={`${urlSitio()}${href}`} titulo={p.titulo} oscuro />
        {verTodo ? (
          <Link
            href={verTodo.href}
            className="group mt-2 flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98]"
          >
            {verTodo.texto}
            <ArrowRight weight="bold" className="size-5 transition-transform duration-700 ease-fluid group-hover:translate-x-1" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
