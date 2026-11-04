import Link from "next/link";
import { Play } from "@phosphor-icons/react/ssr";
import { resumen } from "@/lib/format";
import type { PiezaSC } from "@/lib/types";
import { TimeAgo } from "@/components/TimeAgo";
import { VideoPortada } from "./VideoPortada";

/** Tarjeta de un video en los listados. Lleva a la página del video. */
export function VideoCard({ p }: { p: PiezaSC }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-700 ease-fluid hover:-translate-y-2 hover:shadow-xl">
      <Link href={`/videos/${p.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-video overflow-hidden bg-ink-1">
          <VideoPortada p={p} className="transition-transform duration-700 ease-fluid group-hover:scale-105" />
          <span
            aria-hidden
            className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-hunter text-white shadow-lg transition-transform duration-700 ease-fluid group-hover:scale-110"
          >
            <Play weight="fill" className="size-6 translate-x-px" />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="text-xl font-bold leading-snug">{p.titulo}</h3>
          {p.cuerpo ? <p className="line-clamp-3 text-sm leading-snug text-ink/70">{resumen(p.cuerpo, 150)}</p> : null}
          <div className="mt-auto pt-2 text-xs text-ink/60">
            <TimeAgo iso={p.creada} />
          </div>
        </div>
      </Link>
    </article>
  );
}
