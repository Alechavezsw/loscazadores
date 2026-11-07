"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CaretDown, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { rutaSeccion, SECCIONES } from "@/lib/types";
import { useLive } from "@/components/LiveProvider";
import { Mark } from "./Brand";

/** El último enlace lleva el nombre de la sección de videos, que se cambia desde Ajustes. */
const enlaces = (nombreVideos: string) => [
  { href: "/", label: "Inicio" },
  { href: "/noticias", label: "Noticias" },
  { href: "/en-vivo", label: "En vivo" },
  { href: "/videos", label: nombreVideos },
];

const RETRASOS = ["delay-100", "delay-150", "delay-200", "delay-300"];

function PuntoEnVivo() {
  return (
    <span aria-hidden className="relative flex size-2">
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-hunter" />
      <span className="relative size-2 rounded-full bg-hunter" />
    </span>
  );
}

/** Lee la ruta actual, que en las notas solo se conoce al pedir la página. Va dentro de un Suspense. */
export function PillNav({ contactoHref, nombreVideos }: { contactoHref: string; nombreVideos: string }) {
  return <Pildora contactoHref={contactoHref} nombreVideos={nombreVideos} pathname={usePathname()} />;
}

/** Lo que se ve mientras llega la ruta: la misma barra, sin marcar la página actual. */
export function PillNavSinRuta({ contactoHref, nombreVideos }: { contactoHref: string; nombreVideos: string }) {
  return <Pildora contactoHref={contactoHref} nombreVideos={nombreVideos} pathname="" />;
}

function Pildora({ contactoHref, nombreVideos, pathname }: { contactoHref: string; nombreVideos: string; pathname: string }) {
  const LINKS = enlaces(nombreVideos);
  const { estado } = useLive();
  const enVivo = Boolean(estado?.live);
  const [abierto, setAbierto] = useState(false);
  const [alto, setAlto] = useState(false);
  // El desplegable de secciones de la barra de escritorio.
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(false);
  const itemSecciones = useRef<HTMLLIElement>(null);
  const centinela = useRef<HTMLDivElement>(null);

  // La píldora se oscurece un poco cuando ya no estamos arriba de todo. Sin listener de scroll.
  useEffect(() => {
    const el = centinela.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setAlto(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  // El desplegable de secciones se cierra al tocar afuera o con Escape.
  useEffect(() => {
    if (!seccionesAbiertas) return;
    const alTocar = (e: PointerEvent) => {
      if (!itemSecciones.current?.contains(e.target as Node)) setSeccionesAbiertas(false);
    };
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setSeccionesAbiertas(false);
    document.addEventListener("pointerdown", alTocar);
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      window.removeEventListener("keydown", alTeclear);
    };
  }, [seccionesAbiertas]);

  const activo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const enSecciones = pathname.startsWith("/secciones/");

  return (
    <>
      <div ref={centinela} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
        <nav
          aria-label="Principal"
          className={cn(
            "pointer-events-auto mx-auto mt-6 flex w-max max-w-full items-center gap-2 rounded-full border border-white/15 p-2 text-white backdrop-blur-xl transition-all duration-700 ease-fluid",
            alto || abierto ? "bg-black/80" : "bg-black/50",
          )}
        >
          <Link
            href="/"
            aria-label="Los Cazadores de Noticias, ir al inicio"
            className="flex items-center gap-2 rounded-full py-1 pl-2 pr-3 transition-colors duration-700 ease-fluid hover:bg-white/10"
          >
            <Mark className="size-6 text-white" />
            <span className="text-sm font-semibold uppercase tracking-wide">Los Cazadores</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const on = activo(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
                      on ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>{l.label}</span>
                    {l.href === "/en-vivo" && enVivo ? <PuntoEnVivo /> : null}
                  </Link>
                </li>
              );
            })}

            <li ref={itemSecciones} className="relative">
              <button
                type="button"
                onClick={() => setSeccionesAbiertas((v) => !v)}
                aria-expanded={seccionesAbiertas}
                aria-controls="menu-secciones"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
                  enSecciones ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Secciones
                <CaretDown
                  weight="bold"
                  className={cn("size-3.5 transition-transform duration-700 ease-fluid", seccionesAbiertas && "rotate-180")}
                  aria-hidden
                />
              </button>
              <div
                id="menu-secciones"
                inert={!seccionesAbiertas}
                className={cn(
                  "absolute left-0 top-full mt-4 w-60 rounded-2xl border border-white/15 bg-black/90 p-2 transition-all duration-500 ease-fluid",
                  seccionesAbiertas ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
                )}
              >
                <ul className="flex flex-col">
                  {SECCIONES.map((s) => {
                    const on = pathname === rutaSeccion(s);
                    return (
                      <li key={s.slug}>
                        <Link
                          href={rutaSeccion(s)}
                          onClick={() => setSeccionesAbiertas(false)}
                          aria-current={on ? "page" : undefined}
                          className={cn(
                            "block rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-700 ease-fluid",
                            on ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {s.nombre}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          </ul>

          {contactoHref ? (
            <a
              href={contactoHref}
              data-evento="enviar-noticia"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-hunter px-3 py-2 text-sm font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter-dark active:scale-[0.98] md:flex"
            >
              <WhatsappLogo weight="fill" className="size-4" aria-hidden />
              Enviá tu noticia
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
            className="relative flex size-10 items-center justify-center rounded-full transition-colors duration-700 ease-fluid hover:bg-white/10 md:hidden"
          >
            {enVivo && !abierto ? (
              <span className="absolute right-2 top-2">
                <PuntoEnVivo />
              </span>
            ) : null}
            <span
              aria-hidden
              className={cn(
                "absolute h-0.5 w-5 rounded-full bg-white transition-all duration-700 ease-fluid",
                abierto ? "translate-y-0 rotate-45" : "-translate-y-1",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "absolute h-0.5 w-5 rounded-full bg-white transition-all duration-700 ease-fluid",
                abierto ? "translate-y-0 -rotate-45" : "translate-y-1",
              )}
            />
          </button>
        </nav>
      </header>

      <div
        id="menu-movil"
        inert={!abierto}
        className={cn(
          "fixed inset-0 z-40 flex flex-col justify-center bg-black/80 px-6 backdrop-blur-3xl transition-all duration-700 ease-fluid md:hidden",
          abierto ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ul className="flex flex-col gap-2">
          {[...LINKS].map((l, i) => {
            const on = activo(l.href);
            return (
              <li key={l.href} className="overflow-hidden">
                <Link
                  href={l.href}
                  onClick={() => setAbierto(false)}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 py-2 text-5xl font-bold uppercase tracking-tight transition-all duration-700 ease-fluid",
                    abierto ? `translate-y-0 opacity-100 ${RETRASOS[i]}` : "translate-y-12 opacity-0",
                    on ? "text-white" : "text-white/50",
                  )}
                >
                  <span>{l.label}</span>
                  {l.href === "/en-vivo" && enVivo ? <PuntoEnVivo /> : null}
                </Link>
              </li>
            );
          })}
          <li className="overflow-hidden pt-4">
            <div
              className={cn(
                "transition-all duration-700 ease-fluid",
                abierto ? "translate-y-0 opacity-100 delay-300" : "translate-y-12 opacity-0",
              )}
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">Secciones</p>
              <div className="flex flex-wrap gap-2">
                {SECCIONES.map((s) => {
                  const on = pathname === rutaSeccion(s);
                  return (
                    <Link
                      key={s.slug}
                      href={rutaSeccion(s)}
                      onClick={() => setAbierto(false)}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "rounded-full border px-4 py-2 text-base font-semibold transition-colors duration-700 ease-fluid",
                        on ? "border-white bg-white text-ink" : "border-white/25 text-white/80",
                      )}
                    >
                      {s.nombre}
                    </Link>
                  );
                })}
              </div>
            </div>
          </li>
          {contactoHref ? (
            <li className="overflow-hidden pt-6">
              <a
                href={contactoHref}
                data-evento="enviar-noticia"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex w-max items-center gap-2 rounded-full bg-hunter px-6 py-3 text-base font-semibold text-white transition-all duration-700 ease-fluid",
                  abierto ? "translate-y-0 opacity-100 delay-300" : "translate-y-12 opacity-0",
                )}
              >
                <WhatsappLogo weight="fill" className="size-5" aria-hidden />
                Enviá tu noticia
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}
