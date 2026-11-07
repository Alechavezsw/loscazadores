"use client";

import { useHidratado } from "@/lib/use-hidratado";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { ArrowsClockwise, FacebookLogo, InstagramLogo, Rss } from "@phosphor-icons/react/ssr";
import { agregarFeed, importarFeedAhora, quitarFeed, type FormState } from "@/app/semiton/actions";
import { cn } from "@/lib/cn";
import { ConfirmButton } from "./ConfirmButton";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";

const INICIAL: FormState = { ok: false };

type FeedVista = {
  id: string;
  nombre: string;
  host: string;
  red: "instagram" | "facebook";
  ultima: string | null;
  nuevas: number;
  fusionadas: number;
  error?: string;
};

function Fila({ feed }: { feed: FeedVista }) {
  const [res, importar, importando] = useActionState(importarFeedAhora.bind(null, feed.id), null as FormState | null);
  const Icono = feed.red === "instagram" ? InstagramLogo : FacebookLogo;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Icono weight="fill" className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{feed.nombre}</p>
            <p className="truncate text-xs text-ink/60">{feed.host}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={importar}>
            <button type="submit" disabled={importando} className={cn(botonSecundario, "px-3 py-1 text-sm")}>
              <ArrowsClockwise className={cn("size-4", importando && "animate-spin")} aria-hidden />
              {importando ? "Importando…" : "Importar ahora"}
            </button>
          </form>
          <form action={quitarFeed.bind(null, feed.id)}>
            <ConfirmButton etiqueta="Quitar" pregunta="¿Quitar este feed?" confirmar="Sí, quitar" chico />
          </form>
        </div>
      </div>

      {feed.error ? (
        <Mensaje ok={false}>{feed.error}</Mensaje>
      ) : (
        <p className="text-xs text-ink/60">
          {feed.ultima
            ? `Última revisión: ${feed.ultima}. ${feed.nuevas === 1 ? "1 publicación nueva" : `${feed.nuevas} publicaciones nuevas`}${feed.fusionadas ? `, ${feed.fusionadas} unida${feed.fusionadas === 1 ? "" : "s"}` : ""}.`
            : "Todavía no se revisó."}
        </p>
      )}
      <div aria-live="polite" className="empty:hidden">
        {res?.mensaje ? <Mensaje ok={res.ok}>{res.mensaje}</Mensaje> : null}
      </div>
    </li>
  );
}

export function FeedsPanel({ feeds }: { feeds: FeedVista[] }) {
  const [estado, accion, agregando] = useActionState(agregarFeed, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  const hidratado = useHidratado();
  const errores = estado.errores ?? {};

  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado]);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <section className={cn(tarjeta, "flex flex-col gap-5")} aria-labelledby="feeds">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="feeds" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Rss className="size-6" aria-hidden />
          Enlaces de feed
        </h2>
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/60">
          {feeds.length === 0 ? "Ninguno" : feeds.length === 1 ? "1 cargado" : `${feeds.length} cargados`}
        </span>
      </div>

      <p className="max-w-[680px] text-base text-ink/70">
        Algunos servicios se conectan a tu Instagram o Facebook y te dan un enlace con tus publicaciones, en JSON o RSS. Pegalo acá y el sitio
        lo revisa solo. Sirve Behold, RSS.app y cualquier otro que entregue RSS, Atom o JSON Feed. Algunos tienen un plan gratis con límites y
        otros son pagos: conviene mirar sus condiciones.
      </p>

      {feeds.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {feeds.map((f) => (
            <Fila key={f.id} feed={f} />
          ))}
        </ul>
      ) : null}

      <form ref={form} method="post" onSubmit={alEnviar} className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-4">
        <h3 className="text-base font-bold">Agregar un feed</h3>
        <Campo id="feed-url" etiqueta="Enlace del feed" error={errores.url} ayuda="Tiene que empezar con https://.">
          <input
            id="feed-url"
            name="url"
            inputMode="url"
            required
            placeholder="https://"
            autoComplete="off"
            aria-invalid={errores.url ? true : undefined}
            className={input}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="feed-red" etiqueta="De qué red es" ayuda="Se usa cuando el feed no deja ver de cuál es cada publicación.">
            <select id="feed-red" name="red" defaultValue="instagram" className={input}>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </Campo>
          <Campo id="feed-nombre" etiqueta="Nombre (opcional)" ayuda="Para reconocerlo en la lista.">
            <input id="feed-nombre" name="nombre" maxLength={60} className={input} />
          </Campo>
        </div>
        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}
        <div>
          <button type="submit" disabled={agregando || !hidratado} className={botonPrimario}>
            {agregando ? "Probando el enlace…" : "Agregar feed"}
          </button>
        </div>
      </form>
    </section>
  );
}
