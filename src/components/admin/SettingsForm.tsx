"use client";

import { useHidratado } from "@/lib/use-hidratado";
import { startTransition, useActionState, useRef, useState } from "react";
import { guardarAjustes, probarEnVivo, type FormState, type PruebaLive } from "@/app/semiton/actions";
import { cn } from "@/lib/cn";
import type { Ajustes, YoutubeModo } from "@/lib/types";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";

const INICIAL: FormState = { ok: false };

const MODOS: { valor: YoutubeModo; titulo: string; detalle: string }[] = [
  { valor: "auto", titulo: "Automático", detalle: "El sitio mira cada minuto si el canal está en vivo y muestra el video solo." },
  { valor: "manual", titulo: "Manual", detalle: "Vos pegás el video que está en vivo. Sirve si la detección automática falla." },
  { valor: "off", titulo: "Apagado", detalle: "No se muestra ninguna transmisión." },
];

const MOTIVOS: Record<string, string> = {
  "en-vivo": "El canal está en vivo ahora.",
  manual: "Se está mostrando el video que pegaste.",
  "sin-transmision": "El canal existe pero no está transmitiendo en este momento.",
  "sin-canal": "Falta el canal de YouTube o el video manual.",
  apagado: "La transmisión está apagada.",
  error: "YouTube no respondió. Probá de nuevo en un rato.",
};

function Seccion({ titulo, detalle, children }: { titulo: string; detalle?: string; children: React.ReactNode }) {
  return (
    <section className={cn(tarjeta, "grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]")}>
      <div>
        <h2 className="text-xl font-bold tracking-tight">{titulo}</h2>
        {detalle ? <p className="mt-1 text-sm text-ink/60">{detalle}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ ajustes }: { ajustes: Ajustes }) {
  const [estado, accion, pendiente] = useActionState(guardarAjustes, INICIAL);
  const [prueba, probar, probando] = useActionState<PruebaLive, FormData>(probarEnVivo, null);
  const [pruebaTomateve, probarTomateve, probandoTomateve] = useActionState<PruebaLive, FormData>(probarEnVivo, null);
  const [modo, setModo] = useState<YoutubeModo>(ajustes.youtubeModo);
  const form = useRef<HTMLFormElement>(null);
  const hidratado = useHidratado();
  const errores = estado.errores ?? {};

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  function alProbar() {
    if (!form.current) return;
    const datos = new FormData(form.current);
    startTransition(() => probar(datos));
  }

  function alProbarTomateve() {
    if (!form.current) return;
    const datos = new FormData(form.current);
    datos.set("canal", "tomateve");
    startTransition(() => probarTomateve(datos));
  }

  return (
    <form ref={form} method="post" onSubmit={alEnviar} className="flex flex-col gap-6">
      <Seccion titulo="Portada" detalle="Los textos que acompañan el logo.">
        <Campo id="lema" etiqueta="Lema" error={errores.lema}>
          <input id="lema" name="lema" required defaultValue={ajustes.lema} aria-invalid={errores.lema ? true : undefined} className={input} />
        </Campo>
        <Campo id="aviso" etiqueta="Aviso legal" error={errores.aviso} ayuda="Aparece debajo de la cabecera y en el pie de página.">
          <textarea id="aviso" name="aviso" required rows={3} defaultValue={ajustes.aviso} aria-invalid={errores.aviso ? true : undefined} className={cn(input, "resize-y")} />
        </Campo>
      </Seccion>

      <Seccion titulo="Textos de la portada" detalle="La frase grande que va debajo de los videos y la invitación a mandar información.">
        <Campo id="declaracion" etiqueta="Frase institucional" error={errores.declaracion} ayuda="Se va encendiendo palabra por palabra al bajar por la portada.">
          <textarea id="declaracion" name="declaracion" required rows={4} defaultValue={ajustes.declaracion} aria-invalid={errores.declaracion ? true : undefined} className={cn(input, "resize-y")} />
        </Campo>
        <Campo id="historiaTitulo" etiqueta="Título de la invitación" error={errores.historiaTitulo}>
          <input id="historiaTitulo" name="historiaTitulo" required maxLength={60} defaultValue={ajustes.historiaTitulo} aria-invalid={errores.historiaTitulo ? true : undefined} className={input} />
        </Campo>
        <Campo id="historiaTexto" etiqueta="Texto de la invitación" error={errores.historiaTexto} ayuda="Se muestra entre comillas, una de cada lado.">
          <input id="historiaTexto" name="historiaTexto" required maxLength={200} defaultValue={ajustes.historiaTexto} aria-invalid={errores.historiaTexto ? true : undefined} className={input} />
        </Campo>
      </Seccion>

      <Seccion titulo="Sección de videos" detalle="El nombre que lleva en el menú, en los títulos y en el pie de página.">
        <Campo id="nombreVideos" etiqueta="Nombre de la sección" error={errores.nombreVideos} ayuda="Por ejemplo: Sin censura o Sin filtro. Se cambia en todo el sitio al guardar.">
          <input id="nombreVideos" name="nombreVideos" required minLength={3} maxLength={30} defaultValue={ajustes.nombreVideos} aria-invalid={errores.nombreVideos ? true : undefined} className={input} />
        </Campo>
      </Seccion>

      <Seccion titulo="Redes" detalle="Los botones de cada columna y del pie abren estos enlaces. Si dejás uno vacío, el botón queda deshabilitado.">
        <Campo id="whatsappCanal" etiqueta="Canal de WhatsApp" error={errores.whatsappCanal} ayuda="Por ejemplo: https://whatsapp.com/channel/…">
          <input id="whatsappCanal" name="whatsappCanal" inputMode="url" defaultValue={ajustes.whatsappCanal} aria-invalid={errores.whatsappCanal ? true : undefined} className={input} />
        </Campo>
        <Campo id="instagram" etiqueta="Instagram" error={errores.instagram} ayuda="El usuario o el enlace del perfil.">
          <input id="instagram" name="instagram" defaultValue={ajustes.instagram} aria-invalid={errores.instagram ? true : undefined} className={input} />
        </Campo>
        <Campo id="facebook" etiqueta="Facebook" error={errores.facebook} ayuda="El enlace de la página.">
          <input id="facebook" name="facebook" inputMode="url" defaultValue={ajustes.facebook} aria-invalid={errores.facebook ? true : undefined} className={input} />
        </Campo>
      </Seccion>

      <Seccion titulo="YouTube en vivo" detalle="Cuando el canal transmite, el video aparece arriba de la portada y en la página En vivo.">
        <Campo id="youtube" etiqueta="Canal de YouTube" error={errores.youtube} ayuda="El @usuario del canal, su ID que empieza con UC o el enlace.">
          <input id="youtube" name="youtube" defaultValue={ajustes.youtube} placeholder="@tucanal" aria-invalid={errores.youtube ? true : undefined} className={input} />
        </Campo>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Cómo se detecta la transmisión</legend>
          {MODOS.map((m) => (
            <label
              key={m.valor}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors duration-700 ease-fluid has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-hunter",
                modo === m.valor ? "border-ink bg-paper" : "border-line hover:border-ink",
              )}
            >
              <input
                type="radio"
                name="youtubeModo"
                value={m.valor}
                checked={modo === m.valor}
                onChange={() => setModo(m.valor)}
                className="mt-1 size-4 accent-hunter"
              />
              <span>
                <span className="block text-sm font-semibold">{m.titulo}</span>
                <span className="block text-xs text-ink/60">{m.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {modo === "manual" ? (
          <Campo id="youtubeVideoManual" etiqueta="Video que está en vivo" error={errores.youtubeVideoManual} ayuda="Pegá el enlace del video o su ID de 11 letras.">
            <input
              id="youtubeVideoManual"
              name="youtubeVideoManual"
              defaultValue={ajustes.youtubeVideoManual}
              aria-invalid={errores.youtubeVideoManual ? true : undefined}
              className={input}
            />
          </Campo>
        ) : (
          <input type="hidden" name="youtubeVideoManual" value={ajustes.youtubeVideoManual} />
        )}

        <div className="flex flex-col items-start gap-3">
          <button type="button" onClick={alProbar} disabled={probando} className={botonSecundario}>
            {probando ? "Consultando a YouTube…" : "Probar ahora"}
          </button>
          {prueba ? (
            <div aria-live="polite" className="w-full">
              <Mensaje ok={prueba.estado.live}>
                {MOTIVOS[prueba.estado.motivo]}
                {prueba.estado.titulo ? ` “${prueba.estado.titulo}”` : ""}
              </Mensaje>
            </div>
          ) : null}
        </div>
      </Seccion>

      <Seccion titulo="Tomateve en vivo" detalle="Los lunes: Madres en Corto de 20:00 a 22:00 y La Rockola de Beethoven de 22:00 a 00:00. Cuando el canal transmite, el video aparece solo en la portada con la insignia EN VIVO.">
        <Campo id="tomateve" etiqueta="Canal de YouTube de Tomateve" error={errores.tomateve} ayuda="El @usuario del canal, su ID que empieza con UC o el enlace. También es el enlace del botón de YouTube en «Lo último en nuestras redes» y en el pie. Si lo dejás vacío se usa el canal oficial, @somostomateve.">
          <input id="tomateve" name="tomateve" defaultValue={ajustes.tomateve} placeholder="@somostomateve" aria-invalid={errores.tomateve ? true : undefined} className={input} />
        </Campo>
        <div className="flex flex-col items-start gap-3">
          <button type="button" onClick={alProbarTomateve} disabled={probandoTomateve} className={botonSecundario}>
            {probandoTomateve ? "Consultando a YouTube…" : "Probar ahora"}
          </button>
          {pruebaTomateve ? (
            <div aria-live="polite" className="w-full">
              <Mensaje ok={pruebaTomateve.estado.live}>
                {MOTIVOS[pruebaTomateve.estado.motivo]}
                {pruebaTomateve.estado.titulo ? ` “${pruebaTomateve.estado.titulo}”` : ""}
              </Mensaje>
            </div>
          ) : null}
        </div>
      </Seccion>

      <Seccion titulo="Radio del Sur" detalle="Se Armó el Bailongo, sábados de 18:00 a 21:00. El reproductor de la página ya usa la señal en vivo de la radio.">
        <Campo id="radioEnlace" etiqueta="Enlace para escuchar la radio" error={errores.radioEnlace} ayuda="Opcional. Si lo cargás, aparece el botón «Escuchar en el sitio de la radio» junto al reproductor.">
          <input id="radioEnlace" name="radioEnlace" inputMode="url" defaultValue={ajustes.radioEnlace} placeholder="https://" aria-invalid={errores.radioEnlace ? true : undefined} className={input} />
        </Campo>
      </Seccion>

      <Seccion titulo="Contacto" detalle="Recibe las noticias de los vecinos y las consultas de publicidad.">
        <Campo id="whatsappContacto" etiqueta="WhatsApp" error={errores.whatsappContacto} ayuda="Con código de país y sin signos. Para Argentina celular: 549 + código de área + número.">
          <input
            id="whatsappContacto"
            name="whatsappContacto"
            inputMode="numeric"
            defaultValue={ajustes.whatsappContacto}
            aria-invalid={errores.whatsappContacto ? true : undefined}
            className={input}
          />
        </Campo>
      </Seccion>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pendiente || !hidratado} className={botonPrimario}>
          {pendiente ? "Guardando…" : "Guardar ajustes"}
        </button>
        {estado.mensaje ? <Mensaje ok={estado.ok}>{estado.mensaje}</Mensaje> : null}
      </div>
    </form>
  );
}
