"use client";

import { useActionState } from "react";
import { WarningCircle } from "@phosphor-icons/react/ssr";
import { desactivarWebhook, generarClaveWebhook, type FormState } from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import { ConfirmButton } from "./ConfirmButton";
import { CopiarCampo } from "./CopiarCampo";
import { botonPrimario, Mensaje, tarjeta } from "./ui";

type Evento = {
  en: string;
  red: string | null;
  estado: "nueva" | "unida" | "repetida" | "error";
  detalle?: string;
};

type Props = {
  activo: boolean;
  creada: string | null;
  recibidos: number;
  eventos: Evento[];
  url: string;
  /** El sitio todavía corre en esta computadora: Make y Zapier no pueden llegar. */
  local: boolean;
};

const ETIQUETA: Record<Evento["estado"], { texto: string; clase: string }> = {
  nueva: { texto: "Nueva", clase: "bg-wa/15 text-[#0f6b35]" },
  unida: { texto: "Unida", clase: "bg-fb/15 text-[#0b4fb3]" },
  repetida: { texto: "Repetida", clase: "bg-ink/10 text-ink/60" },
  error: { texto: "Error", clase: "bg-hunter/15 text-hunter-dark" },
};

const CAMPOS: Array<[string, string]> = [
  ["enlace", "Obligatorio. El enlace de la publicación original."],
  ["texto", "El texto de la publicación (caption en Instagram, message en Facebook)."],
  ["imagen", "Enlace de la foto. En un video, el de su miniatura."],
  ["red", "instagram o facebook. Se deduce solo si el enlace es de una de las dos."],
  ["id", "Identificador de la publicación. Si falta, se usa el enlace."],
  ["fecha", "Cuándo se publicó. Si falta, se usa el momento del aviso."],
];

export function WebhookPanel({ activo, creada, recibidos, eventos, url, local }: Props) {
  const [generada, generar, generando] = useActionState(generarClaveWebhook, null as FormState | null);

  return (
    <section className={cn(tarjeta, "flex flex-col gap-5")} aria-labelledby="avisos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="avisos" className="text-xl font-bold tracking-tight">
          Avisos desde Make o Zapier
        </h2>
        {activo ? (
          <span className="rounded-full bg-wa/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0f6b35]">Activo</span>
        ) : (
          <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/60">Sin activar</span>
        )}
      </div>

      <p className="max-w-[680px] text-base text-ink/70">
        Cada vez que publicás en Instagram o Facebook, Make o Zapier le avisa al sitio y la publicación se importa. No hace falta crear ninguna
        app de Meta: en Make o Zapier te conectás con tu login de Facebook.
      </p>

      {local ? (
        <p role="note" className="flex items-start gap-2 rounded-lg border border-line bg-paper px-4 py-3 text-sm">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-hunter" aria-hidden />
          <span>
            Este sitio todavía corre en tu computadora, y Make y Zapier no pueden llegar hasta ahí. Va a funcionar cuando el sitio esté publicado
            en internet. Para probarlo antes, se puede usar un túnel como Cloudflare Tunnel o ngrok.
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-3">
        <form action={generar}>
          {activo ? (
            <ConfirmButton
              etiqueta="Cambiar la clave"
              pregunta="Las conexiones actuales dejan de funcionar. ¿Seguro?"
              confirmar="Sí, cambiarla"
              conIcono={false}
            />
          ) : (
            <button type="submit" disabled={generando} className={botonPrimario}>
              {generando ? "Generando…" : "Generar clave"}
            </button>
          )}
        </form>
        {activo ? (
          <form action={desactivarWebhook}>
            <ConfirmButton etiqueta="Desactivar" pregunta="¿Desactivar los avisos?" confirmar="Sí, desactivar" conIcono={false} />
          </form>
        ) : null}
      </div>

      {generada?.clave ? (
        <div className="flex flex-col gap-4 rounded-lg border border-ink bg-paper p-4">
          <Mensaje ok>{generada.mensaje}</Mensaje>
          <CopiarCampo id="aviso-url" etiqueta="Dirección a la que se manda el aviso" valor={url} />
          <CopiarCampo id="aviso-clave" etiqueta="Clave" valor={generada.clave} />
          <p className="text-xs text-ink/60">
            Se manda en el encabezado <code className="rounded bg-ink/10 px-1">Authorization</code> con el valor{" "}
            <code className="rounded bg-ink/10 px-1">Bearer</code> seguido de la clave. En el sitio solo queda una huella, así que si la perdés
            hay que generar otra.
          </p>
        </div>
      ) : generada && !generada.ok ? (
        <Mensaje ok={false}>{generada.mensaje}</Mensaje>
      ) : activo ? (
        <p className="text-sm text-ink/60">
          Clave activa desde {creada}. Dirección de avisos: <code className="rounded bg-ink/10 px-1 text-xs">{url}</code>
        </p>
      ) : null}

      <details className="rounded-lg border border-line bg-paper px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold">Cómo configurarlo en Make o Zapier</summary>
        <div className="mt-3 flex flex-col gap-4 text-ink/80">
          <div>
            <p className="font-semibold text-ink">En Make</p>
            <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5">
              <li>Creá un escenario. Como primer módulo, el de Instagram for Business que detecta publicaciones nuevas (Watch Media), y conectalo con tu login de Facebook. Para Facebook, el módulo de Facebook Pages que detecta posts nuevos.</li>
              <li>
                Como segundo módulo, HTTP, Make a request. URL: la dirección de arriba. Método: POST. Encabezado{" "}
                <code className="rounded bg-ink/10 px-1">Authorization</code> con <code className="rounded bg-ink/10 px-1">Bearer</code> y tu clave.
              </li>
              <li>
                En Body type elegí <strong className="font-semibold">application/x-www-form-urlencoded</strong> y cargá los campos de la tabla de abajo
                con los datos del primer módulo. Así los textos con comillas o saltos de línea no rompen el aviso.
              </li>
              <li>Activá el escenario y publicá algo. Acá abajo debería aparecer el aviso.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-ink">En Zapier</p>
            <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5">
              <li>Trigger: Instagram for Business o Facebook Pages, publicación nueva.</li>
              <li>
                Acción: Webhooks by Zapier, POST. URL de arriba, Payload Type Form o JSON, y los campos de la tabla. En Headers,{" "}
                <code className="rounded bg-ink/10 px-1">Authorization</code> con <code className="rounded bg-ink/10 px-1">Bearer</code> y la clave.
              </li>
            </ol>
          </div>
          <p className="text-xs text-ink/60">
            Los nombres exactos de los módulos pueden variar. Cualquier otra herramienta que pueda hacer un pedido POST también sirve. Si tu
            herramienta no deja agregar encabezados, se puede poner la clave en la dirección como <code className="rounded bg-ink/10 px-1">?clave=…</code>,
            aunque es menos seguro porque queda en los registros.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Campos que acepta el aviso</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-1 pr-4 font-semibold">Campo</th>
                  <th scope="col" className="py-1 font-semibold">Qué lleva</th>
                </tr>
              </thead>
              <tbody>
                {CAMPOS.map(([campo, detalle]) => (
                  <tr key={campo} className="border-b border-line/60 align-top">
                    <th scope="row" className="py-1 pr-4 font-code font-semibold">{campo}</th>
                    <td className="py-1">{detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/60">
            También se entienden los nombres de la API de Meta (caption, message, media_url, permalink, permalink_url, timestamp, created_time),
            por si tu herramienta los pasa tal cual.
          </p>
        </div>
      </details>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink/60">
          Últimos avisos{recibidos > 0 ? ` (${recibidos} en total)` : ""}
        </h3>
        {eventos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {eventos.map((e, i) => (
              <li key={`${e.en}-${i}`} className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border border-line px-3 py-2 text-sm">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide", ETIQUETA[e.estado].clase)}>
                  {ETIQUETA[e.estado].texto}
                </span>
                <span className="font-semibold">{e.red === "instagram" ? "Instagram" : e.red === "facebook" ? "Facebook" : "Sin red"}</span>
                <span className="min-w-0 flex-1 text-ink/70">{e.detalle}</span>
                <span className="text-xs text-ink/60">{e.en}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink/60">
            Todavía no llegó ningún aviso. Cuando publiques algo con la conexión armada, lo vas a ver acá.
          </p>
        )}
      </div>
    </section>
  );
}
