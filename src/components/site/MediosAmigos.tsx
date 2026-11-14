import { FacebookLogo, Globe, Handshake, InstagramLogo, TiktokLogo, WhatsappLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import type { MedioAmigo } from "@/lib/types";
import { Photo } from "./Brand";

type IconoRed = typeof InstagramLogo;

/** El ícono de la red a la que lleva el enlace. Si no es una red conocida, un globo. */
function redDelEnlace(enlace: string): { Icono: IconoRed; nombre: string } | null {
  if (!enlace) return null;
  let host = "";
  try {
    host = new URL(enlace).hostname.replace(/^www\./, "");
  } catch {
    return { Icono: Globe, nombre: "Sitio web" };
  }
  if (host.endsWith("instagram.com")) return { Icono: InstagramLogo, nombre: "Instagram" };
  if (host.endsWith("facebook.com") || host === "fb.com" || host.endsWith(".fb.com")) return { Icono: FacebookLogo, nombre: "Facebook" };
  if (host.endsWith("youtube.com") || host === "youtu.be") return { Icono: YoutubeLogo, nombre: "YouTube" };
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return { Icono: WhatsappLogo, nombre: "WhatsApp" };
  if (host.endsWith("tiktok.com")) return { Icono: TiktokLogo, nombre: "TikTok" };
  if (host === "x.com" || host.endsWith("twitter.com")) return { Icono: XLogo, nombre: "X" };
  return { Icono: Globe, nombre: "Sitio web" };
}

function Casillero({ medio, enlace, grande }: { medio: MedioAmigo; enlace: string; grande: boolean }) {
  const red = redDelEnlace(enlace);
  const Icono = red?.Icono;
  const contenido = (
    <>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-ink shadow-[0_16px_36px_-28px_rgba(0,0,0,0.7)] ring-1 ring-line",
          grande ? "h-28" : "h-20",
        )}
      >
        {medio.logo ? (
          <Photo nombre={medio.logo} alt={medio.nombre} className="h-auto max-h-full w-auto max-w-full object-contain" />
        ) : (
          <span className="text-center text-xs font-extrabold uppercase leading-tight tracking-tight sm:text-sm">{medio.nombre}</span>
        )}
        {Icono ? (
          <span className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-hunter text-white ring-2 ring-white">
            <Icono weight="fill" className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-ink/60">{red?.nombre ?? medio.tipo}</p>
    </>
  );

  return enlace ? (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${medio.nombre} en ${red?.nombre ?? medio.tipo}, se abre en otra pestaña`}
      className="group block transition-transform duration-700 ease-fluid hover:-translate-y-1"
    >
      {contenido}
    </a>
  ) : (
    <div>{contenido}</div>
  );
}

/**
 * Los logos de los medios aliados, cada uno con su enlace. Vienen del panel («Medios amigos»), ya filtrados por los
 * que están activos y en su orden. `grande` es para la página de la sección.
 */
export function MediosAmigos({ medios, grande = false }: { medios: MedioAmigo[]; grande?: boolean }) {
  if (medios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded border border-dashed border-line p-8 text-center">
        <Handshake className="size-8 text-ink/30" aria-hidden />
        <p className="text-sm font-semibold">Pronto vas a ver acá a nuestros medios amigos</p>
      </div>
    );
  }
  return (
    <ul className={cn("grid grid-cols-2 sm:grid-cols-3", grande ? "gap-4 lg:grid-cols-4 xl:grid-cols-5" : "gap-3")}>
      {medios.map((m) => (
        <li key={m.id}>
          <Casillero medio={m} enlace={m.enlace} grande={grande} />
        </li>
      ))}
    </ul>
  );
}
