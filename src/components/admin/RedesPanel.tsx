"use client";

import { useHidratado } from "@/lib/use-hidratado";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { ArrowsClockwise, CheckCircle, FacebookLogo, InstagramLogo, PlugsConnected } from "@phosphor-icons/react/ssr";
import {
  conectarMeta,
  desconectarMeta,
  guardarSync,
  probarMeta,
  sincronizarAhora,
  type FormState,
} from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import { CATEGORIAS } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { botonPrimario, botonSecundario, Campo, input, Mensaje, tarjeta } from "./ui";

const INICIAL: FormState = { ok: false };
const INTERVALOS = [5, 10, 15, 30, 60];

type Props = {
  conexion: { pageNombre: string; igUsuario: string | null; conectadaEn: string } | null;
  estado: {
    ultima: string | null;
    instagram?: { nuevas: number; fusionadas: number; error?: string };
    facebook?: { nuevas: number; fusionadas: number; error?: string };
    reconectar?: boolean;
  };
  ajustes: {
    sincronizar: boolean;
    sincronizarPublicar: boolean;
    sincronizarCategoria: string;
    sincronizarCadaMin: number;
  };
  appConfigurada: boolean;
};

function ResultadoRed({
  nombre,
  Icono,
  r,
}: {
  nombre: string;
  Icono: typeof InstagramLogo;
  r?: { nuevas: number; fusionadas: number; error?: string };
}) {
  if (!r) return null;
  return (
    <li className="flex items-start gap-3 rounded-lg border border-line px-3 py-2">
      <Icono weight="fill" className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{nombre}</p>
        {r.error ? (
          <p className="text-hunter-dark">{r.error}</p>
        ) : (
          <p className="text-ink/70">
            {r.nuevas === 1 ? "1 publicación nueva" : `${r.nuevas} publicaciones nuevas`}
            {r.fusionadas > 0 ? `, ${r.fusionadas} unida${r.fusionadas === 1 ? "" : "s"} con la otra red` : ""} en la última revisión
          </p>
        )}
      </div>
    </li>
  );
}

function Pasos({ appConfigurada }: { appConfigurada: boolean }) {
  return (
    <details className="rounded-lg border border-line bg-paper px-4 py-3 text-sm" open={!appConfigurada}>
      <summary className="cursor-pointer font-semibold">Cómo conseguir el token, paso a paso</summary>
      <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-ink/80">
        <li>
          Entrá a <strong className="font-semibold">developers.facebook.com</strong> con la cuenta de Facebook que administra la Página, andá a
          Mis apps y creá una app (tipo Empresa).
        </li>
        <li>
          En <strong className="font-semibold">Configuración de la app, Básica</strong> copiá el ID de la app y la clave secreta. Pegalos en el
          archivo <code className="rounded bg-ink/10 px-1">.env.local</code> del servidor como{" "}
          <code className="rounded bg-ink/10 px-1">META_APP_ID</code> y <code className="rounded bg-ink/10 px-1">META_APP_SECRET</code>, y
          reiniciá el servidor. La clave secreta nunca se muestra en el sitio ni en este panel.
          {appConfigurada ? (
            <span className="ml-1 inline-flex items-center gap-1 font-semibold text-[#0f6b35]">
              <CheckCircle weight="fill" className="size-4" aria-hidden />
              Ya está cargada
            </span>
          ) : (
            <span className="ml-1 font-semibold text-hunter-dark">Todavía falta.</span>
          )}
        </li>
        <li>
          La cuenta de Instagram tiene que ser <strong className="font-semibold">profesional</strong> (Empresa o Creador) y estar vinculada a la
          Página de Facebook, desde la configuración de la Página en Cuentas vinculadas.
        </li>
        <li>
          Abrí el <strong className="font-semibold">Explorador de la Graph API</strong> (developers.facebook.com/tools/explorer), elegí tu app y
          tocá Generar token de acceso de usuario. Marcá los permisos{" "}
          <code className="rounded bg-ink/10 px-1">pages_show_list</code>,{" "}
          <code className="rounded bg-ink/10 px-1">pages_read_engagement</code> e{" "}
          <code className="rounded bg-ink/10 px-1">instagram_basic</code>, aceptá y copiá el token.
        </li>
        <li>
          Pegalo abajo y tocá Conectar. El sitio lo canjea por uno de larga duración y guarda el de la Página, que no vence mientras no cambies la
          contraseña de Facebook ni quites la app.
        </li>
      </ol>
      <p className="mt-3 text-xs text-ink/60">
        Mientras la app esté en modo Desarrollo y vos seas administrador de la app y de la Página, Meta no pide revisión.
      </p>
    </details>
  );
}

export function RedesPanel({ conexion, estado, ajustes, appConfigurada }: Props) {
  const [conectar, conectarAccion, conectando] = useActionState(conectarMeta, INICIAL);
  const [sync, syncAccion, sincronizando] = useActionState(sincronizarAhora, null as FormState | null);
  const [prueba, pruebaAccion, probando] = useActionState(probarMeta, null as FormState | null);
  const [guardado, guardarAccion, guardando] = useActionState(guardarSync, INICIAL);
  const formConectar = useRef<HTMLFormElement>(null);
  const hidratado = useHidratado();
  const errores = conectar.errores ?? {};
  const guardadoErr = guardado.errores ?? {};

  // El token no debe quedar a la vista en el campo una vez usado.
  useEffect(() => {
    if (conectar.ok) formConectar.current?.reset();
  }, [conectar]);

  function alConectar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => conectarAccion(datos));
  }

  function alGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => guardarAccion(datos));
  }

  const formularioConectar = (
    <form ref={formConectar} method="post" onSubmit={alConectar} className="flex flex-col gap-4">
      <Campo
        id="token"
        etiqueta="Token de acceso de usuario"
        error={errores.token}
        ayuda="Es el que generaste en el Explorador de la Graph API. Se usa una sola vez para conectar y no queda guardado."
      >
        <input
          id="token"
          name="token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          aria-invalid={errores.token ? true : undefined}
          className={input}
        />
      </Campo>
      <Campo id="pagina" etiqueta="Página (opcional)" ayuda="Solo hace falta si administrás más de una. Escribí su nombre o su ID.">
        <input id="pagina" name="pagina" autoComplete="off" className={input} />
      </Campo>
      {conectar.mensaje ? <Mensaje ok={conectar.ok}>{conectar.mensaje}</Mensaje> : null}
      <div>
        <button type="submit" disabled={conectando || !appConfigurada || !hidratado} className={botonPrimario}>
          <PlugsConnected className="size-5" aria-hidden />
          {conectando ? "Conectando…" : "Conectar"}
        </button>
        {!appConfigurada ? (
          <p className="mt-2 text-xs font-semibold text-hunter-dark">
            Primero cargá META_APP_ID y META_APP_SECRET en el servidor (paso 2).
          </p>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      <section className={cn(tarjeta, "flex flex-col gap-5")} aria-labelledby="conexion">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="conexion" className="text-xl font-bold tracking-tight">
            Conexión directa con Meta
          </h2>
          {conexion ? (
            <span className="rounded-full bg-wa/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0f6b35]">Conectada</span>
          ) : (
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/60">Sin conectar</span>
          )}
        </div>

        {conexion ? (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-ink/60">Página de Facebook</dt>
                <dd className="font-semibold">{conexion.pageNombre}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink/60">Instagram</dt>
                <dd className="font-semibold">{conexion.igUsuario ? `@${conexion.igUsuario}` : "No vinculado"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink/60">Conectada</dt>
                <dd className="font-semibold">{conexion.conectadaEn}</dd>
              </div>
            </dl>

            {estado.reconectar ? (
              <Mensaje ok={false}>
                Meta rechazó el token. Hay que volver a conectar con uno nuevo (abajo, en Cambiar de cuenta o volver a conectar).
              </Mensaje>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-semibold text-ink/60">
                {estado.ultima ? `Última revisión: ${estado.ultima}` : "Todavía no se revisó"}
              </p>
              <ul className="flex flex-col gap-2">
                <ResultadoRed nombre="Instagram" Icono={InstagramLogo} r={estado.instagram} />
                <ResultadoRed nombre="Facebook" Icono={FacebookLogo} r={estado.facebook} />
              </ul>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <form action={syncAccion}>
                <button type="submit" disabled={sincronizando} className={botonPrimario}>
                  <ArrowsClockwise className={cn("size-5", sincronizando && "animate-spin")} aria-hidden />
                  {sincronizando ? "Revisando…" : "Sincronizar ahora"}
                </button>
              </form>
              <form action={pruebaAccion}>
                <button type="submit" disabled={probando} className={botonSecundario}>
                  {probando ? "Probando…" : "Probar conexión"}
                </button>
              </form>
              <form action={desconectarMeta}>
                <ConfirmButton etiqueta="Desconectar" pregunta="¿Desconectar la cuenta?" />
              </form>
            </div>
            <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
              {conectar.ok && conectar.mensaje ? <Mensaje ok>{conectar.mensaje}</Mensaje> : null}
              {sync?.mensaje ? <Mensaje ok={sync.ok}>{sync.mensaje}</Mensaje> : null}
              {prueba?.mensaje ? <Mensaje ok={prueba.ok}>{prueba.mensaje}</Mensaje> : null}
            </div>

            <details className="rounded-lg border border-line px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">Cambiar de cuenta o volver a conectar</summary>
              <div className="mt-4 flex flex-col gap-4">
                <Pasos appConfigurada={appConfigurada} />
                {formularioConectar}
              </div>
            </details>
          </>
        ) : (
          <>
            <p className="max-w-[680px] text-base text-ink/70">
              Es la opción de más control y no depende de ningún servicio de terceros, pero hay que crear una app propia en Meta.
              Conectás la Página de Facebook y su Instagram y el sitio importa solo lo que publiques en cada red.
            </p>
            <Pasos appConfigurada={appConfigurada} />
            {formularioConectar}
          </>
        )}
      </section>

      <form method="post" onSubmit={alGuardar} className={cn(tarjeta, "flex flex-col gap-5")} aria-labelledby="prefs">
        <h2 id="prefs" className="text-xl font-bold tracking-tight">
          Cómo se importa lo que llega
        </h2>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="sincronizar" defaultChecked={ajustes.sincronizar} className="mt-0.5 size-4 accent-hunter" />
          <span>
            <strong className="font-semibold">Revisar solo, cada cierto tiempo.</strong> Vale para la conexión con Meta y para los enlaces
            de feed. Los avisos de Make o Zapier llegan cuando ellos los mandan. Si lo apagás, se importa solo al tocar Sincronizar o Importar ahora.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="sincronizarCadaMin" etiqueta="Cada cuánto se revisa" error={guardadoErr.sincronizarCadaMin}>
            <select id="sincronizarCadaMin" name="sincronizarCadaMin" defaultValue={String(ajustes.sincronizarCadaMin)} className={input}>
              {INTERVALOS.map((m) => (
                <option key={m} value={m}>
                  {m === 60 ? "Cada hora" : `Cada ${m} minutos`}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="sincronizarCategoria" etiqueta="Categoría de lo importado" error={guardadoErr.sincronizarCategoria}>
            <select id="sincronizarCategoria" name="sincronizarCategoria" defaultValue={ajustes.sincronizarCategoria} className={input}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Qué pasa con lo importado</legend>
          {[
            { valor: "publicar", titulo: "Se publica directo", detalle: "Aparece en el sitio apenas se importa." },
            { valor: "borrador", titulo: "Queda como borrador", detalle: "Lo revisás y lo publicás desde Noticias." },
          ].map((o) => (
            <label key={o.valor} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-paper">
              <input
                type="radio"
                name="sincronizarPublicar"
                value={o.valor}
                defaultChecked={(o.valor === "publicar") === ajustes.sincronizarPublicar}
                className="mt-0.5 size-4 accent-hunter"
              />
              <span>
                <span className="block font-semibold">{o.titulo}</span>
                <span className="block text-xs text-ink/60">{o.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={guardando || !hidratado} className={botonPrimario}>
            {guardando ? "Guardando…" : "Guardar preferencias"}
          </button>
          {guardado.mensaje ? <Mensaje ok={guardado.ok}>{guardado.mensaje}</Mensaje> : null}
        </div>
      </form>
    </div>
  );
}
