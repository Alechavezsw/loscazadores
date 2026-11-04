import { CheckCircle, WarningCircle } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none transition-colors duration-700 ease-fluid placeholder:text-ink/40 focus:border-ink aria-[invalid=true]:border-hunter";

const boton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-base font-semibold transition-all duration-700 ease-fluid active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const botonPrimario = cn(boton, "bg-ink text-white hover:bg-hunter");
export const botonSecundario = cn(boton, "border border-line bg-white text-ink hover:border-ink");
export const botonPeligro = cn(boton, "bg-hunter text-white hover:bg-hunter-dark");

export const tarjeta = "rounded-2xl border border-line bg-white p-6";

export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1 text-xs font-semibold text-hunter">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-ink/60">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

export function Mensaje({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold",
        ok ? "border-wa/40 bg-wa/10 text-[#0f6b35]" : "border-hunter/40 bg-hunter/10 text-hunter-dark",
      )}
    >
      {ok ? (
        <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      {children}
    </p>
  );
}

export function TituloPagina({ titulo, bajada, children }: { titulo: string; bajada?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{titulo}</h1>
        {bajada ? <p className="mt-1 max-w-[680px] text-base text-ink/70">{bajada}</p> : null}
      </div>
      {children}
    </div>
  );
}
