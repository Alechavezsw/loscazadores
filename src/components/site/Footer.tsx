import Link from "next/link";
import { WhatsappLogo } from "@phosphor-icons/react/ssr";
import { limpiarUrl, perfilInstagram, perfilYoutube, telefonoLegible } from "@/lib/urls";
import { ESPACIO_INFO, ESPACIOS, type Ajustes } from "@/lib/types";
import { CANAL_UI } from "./canales";
import { Logo } from "./Brand";

export function Footer({ ajustes, contactoHref }: { ajustes: Ajustes; contactoHref: string }) {
  const redes = [
    { canal: "whatsapp", url: limpiarUrl(ajustes.whatsappCanal) },
    { canal: "instagram", url: perfilInstagram(ajustes.instagram) },
    { canal: "facebook", url: limpiarUrl(ajustes.facebook) },
    { canal: "youtube", url: perfilYoutube(ajustes.youtube) || perfilYoutube(ajustes.tomateve) },
  ] as const;

  const enlace =
    "text-sm font-semibold text-white/70 transition-colors duration-700 ease-fluid hover:text-white";

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="flex flex-col items-start gap-6">
          <Link href="/" aria-label="Los Cazadores de Noticias, ir al inicio">
            <Logo className="w-56 md:w-72" />
          </Link>
          <p className="text-sm font-medium text-white/70">“{ajustes.lema}”</p>
          {contactoHref ? (
            <a
              href={contactoHref}
              data-evento="enviar-noticia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:-translate-y-0.5 hover:bg-hunter-dark active:scale-[0.98]"
            >
              <WhatsappLogo weight="fill" className="size-5" aria-hidden />
              Enviá tu noticia
            </a>
          ) : null}
        </div>

        <nav aria-label="Secciones">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/50">Secciones</p>
          <ul className="flex flex-col gap-3">
            <li><Link href="/" className={enlace}>Inicio</Link></li>
            <li><Link href="/noticias" className={enlace}>Noticias</Link></li>
            <li><Link href="/en-vivo" className={enlace}>En vivo</Link></li>
            <li><Link href="/videos" className={enlace}>{ajustes.nombreVideos}</Link></li>
            {ESPACIOS.map((e) => (
              <li key={e}>
                <Link href={ESPACIO_INFO[e].ruta} className={enlace}>{ESPACIO_INFO[e].nombre}</Link>
              </li>
            ))}
            {contactoHref ? (
              <li>
                <a href={contactoHref} data-evento="enviar-noticia" target="_blank" rel="noopener noreferrer" className={enlace}>
                  Enviá tu noticia{telefonoLegible(ajustes.whatsappContacto) ? ` · ${telefonoLegible(ajustes.whatsappContacto)}` : ""}
                </a>
              </li>
            ) : null}
          </ul>
        </nav>

        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/50">Seguinos</p>
          <ul className="flex items-center gap-3">
            {redes.map(({ canal, url }) => {
              const ui = CANAL_UI[canal];
              return (
                <li key={canal}>
                  {url ? (
                    <a
                      href={url}
                      data-evento={`canal-${canal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={ui.nombre}
                      className="flex size-12 items-center justify-center rounded-full border border-white/20 transition-all duration-700 ease-fluid hover:-translate-y-1 hover:border-hunter hover:bg-hunter active:scale-[0.98]"
                    >
                      <ui.Icono weight="fill" className="size-5" aria-hidden />
                    </a>
                  ) : (
                    <span
                      aria-label={`${ui.nombre}, todavía sin enlace`}
                      className="flex size-12 cursor-not-allowed items-center justify-center rounded-full border border-white/10 text-white/30"
                    >
                      <ui.Icono weight="fill" className="size-5" aria-hidden />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 md:flex-row md:items-start md:justify-between md:px-6">
          <p className="max-w-3xl text-xs leading-relaxed text-white/50">{ajustes.aviso}</p>
          <ul className="flex shrink-0 items-center gap-6">
            <li><Link href="/privacidad" className="text-xs font-semibold text-white/70 hover:text-white">Privacidad</Link></li>
            <li><Link href="/terminos" className="text-xs font-semibold text-white/70 hover:text-white">Términos</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
