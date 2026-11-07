import Link from "next/link";
import {
  BookmarkSimple,
  CaretRight,
  ChatCircle,
  GlobeHemisphereWest,
  Heart,
  PaperPlaneTilt,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { tieneVideo } from "@/lib/embeds";
import { cuerpoSinTitulo, resumen } from "@/lib/format";
import type { Canal, Noticia } from "@/lib/types";
import { TimeAgo } from "@/components/TimeAgo";
import { Avatar, BrandCover, Photo } from "./Brand";
import { CANAL_UI } from "./canales";
import { InsigniaVideo } from "./NewsCard";
import { UltimoVideo } from "./UltimoVideo";
import { YoutubeMedia } from "./YoutubeMedia";
import type { VideoCanal } from "@/lib/youtube-canal";

type Props = {
  canal: Canal;
  noticia: Noticia | null;
  perfilUrl: string;
  handleIg: string;
  /** Solo para la columna de YouTube: el último video del canal. Si está, reemplaza a la nota de esa columna. */
  video?: VideoCanal | null;
};

function Media({ n, className }: { n: Noticia; className: string }) {
  return (
    <Link href={`/noticias/${n.slug}`} tabIndex={-1} aria-hidden className={cn("relative block overflow-hidden rounded", className)}>
      {n.imagen ? (
        <Photo nombre={n.imagen} alt="" className="transition-transform duration-700 ease-fluid group-hover:scale-105" />
      ) : (
        <BrandCover etiqueta={n.categoria} className="size-full" />
      )}
      {tieneVideo(n) ? <InsigniaVideo className="absolute left-2 top-2" /> : null}
    </Link>
  );
}

function Titulo({ n, className }: { n: Noticia; className?: string }) {
  return (
    <h3 className={cn("text-base font-bold leading-snug", className)}>
      <Link href={`/noticias/${n.slug}`} className="transition-colors duration-700 ease-fluid hover:text-hunter">
        {n.titulo}
      </Link>
    </h3>
  );
}

function Cabecera({ n, canal, handleIg }: { n: Noticia; canal: Canal; handleIg: string }) {
  if (canal === "instagram") {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-hunter p-0.5">
          <span className="block rounded-full bg-white p-0.5">
            <Avatar className="size-8" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{handleIg}</p>
          <p className="truncate text-xs text-ink/60">{n.zona || "San Juan"}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Los Cazadores de Noticias</p>
        <p className="flex items-center gap-1 text-xs text-ink/60">
          <TimeAgo iso={n.creada} />
          {canal === "facebook" ? (
            <>
              <span aria-hidden>·</span>
              <GlobeHemisphereWest className="size-3" aria-label="Público" />
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/** El ícono de la red a la izquierda de la barra roja, o el logo propio de la columna como avatar redondo. */
function Insignia({ ui }: { ui: (typeof CANAL_UI)[Canal] }) {
  if (ui.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ui.logo} alt="" loading="lazy" decoding="async" className="size-10 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
      <ui.Icono weight="fill" className="size-6" />
    </span>
  );
}

export function ChannelCard({ canal, noticia: n, perfilUrl, handleIg, video }: Props) {
  const ui = CANAL_UI[canal];
  const conVideo = canal === "youtube" ? (video ?? null) : null;
  // Con el último video a la vista, el botón lleva al canal y no al enlace de una nota.
  const destino = (conVideo ? perfilUrl : n?.enlaces[canal] || perfilUrl || "").trim();
  const resto = n ? cuerpoSinTitulo(n.titulo, n.cuerpo) : "";
  const hashtags = n
    ? `#SanJuan #${n.categoria.normalize("NFD").replace(/[̀-ͯ\s]/g, "")} #LosCazadores`
    : "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-700 ease-fluid hover:-translate-y-2 hover:shadow-xl">
      {perfilUrl ? (
        <a
          href={perfilUrl}
          data-evento={`canal-${canal}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("trama flex items-center gap-3 px-3 py-4 text-white", ui.barra)}
        >
          <Insignia ui={ui} />
          <span className="flex-1 text-base font-bold uppercase leading-tight tracking-wide">{ui.nombre}</span>
          <CaretRight weight="bold" className="size-5 transition-transform duration-700 ease-fluid group-hover:translate-x-1" aria-hidden />
        </a>
      ) : (
        <div className={cn("trama flex items-center gap-3 px-3 py-4 text-white", ui.barra)}>
          <Insignia ui={ui} />
          <span className="flex-1 text-base font-bold uppercase leading-tight tracking-wide">{ui.nombre}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-3">
        {conVideo ? (
          <UltimoVideo video={conVideo} />
        ) : n ? (
          <>
            {canal !== "youtube" ? <Cabecera n={n} canal={canal} handleIg={handleIg} /> : null}

            {canal === "youtube" ? (
              <YoutubeMedia imagen={n.imagen} titulo={n.titulo} categoria={n.categoria} slug={n.slug} />
            ) : canal === "facebook" ? null : (
              <Media n={n} className={canal === "instagram" ? "aspect-square" : "aspect-[4/3]"} />
            )}

            {canal === "instagram" ? (
              <div aria-hidden className="flex items-center gap-3 text-ink">
                <Heart className="size-6 text-hunter" weight="fill" />
                <ChatCircle className="size-6" />
                <PaperPlaneTilt className="size-6" />
                <BookmarkSimple className="ml-auto size-6" />
              </div>
            ) : null}

            {canal === "instagram" ? (
              <p className="line-clamp-5 text-sm leading-snug">
                <span className="font-semibold">{handleIg}</span>{" "}
                {/* Lo importado ya trae el texto completo; lo cargado a mano le suma el título al epígrafe. */}
                {n.origen === "instagram" || n.origen === "facebook"
                  ? resumen(n.cuerpo, 160)
                  : `${n.titulo}. ${resumen(n.cuerpo, 140)}`}
              </p>
            ) : (
              <>
                <Titulo n={n} />
                {resto ? <p className="line-clamp-4 text-sm leading-snug text-ink/70">{resumen(resto, 170)}</p> : null}
              </>
            )}

            {/* Las etiquetas de ejemplo solo van en lo cargado a mano: en lo importado no se inventan. */}
            {canal === "instagram" && !n.origen ? <p className="text-sm text-[#00376b]">{hashtags}</p> : null}

            {canal === "facebook" ? <Media n={n} className="aspect-[4/3]" /> : null}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded border border-dashed border-line p-6 text-center">
            <ui.Icono className="size-8 text-ink/30" aria-hidden />
            <p className="text-sm font-semibold">Todavía no hay publicaciones acá</p>
            <p className="text-xs text-ink/60">Cuando subamos algo nuevo, lo vas a ver en esta columna.</p>
          </div>
        )}

        {destino ? (
          <a
            href={destino}
            data-evento={`canal-${canal}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mt-auto flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid active:scale-[0.98]",
              ui.boton,
            )}
          >
            <ui.Icono weight="fill" className="size-5" aria-hidden />
            {ui.cta}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="mt-auto flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-ink/10 px-3 py-2 text-base font-semibold text-ink/50"
          >
            <ui.Icono className="size-5" aria-hidden />
            {canal === "youtube" ? ui.nombre : ui.corto} sin enlace todavía
          </span>
        )}
      </div>
    </article>
  );
}
