import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from "@phosphor-icons/react/ssr";
import { getClimaSanJuan, type Clima } from "@/lib/clima";

function Icono({ condicion, clase = "size-8" }: { condicion: string; clase?: string }) {
  if (condicion === "Despejado" || condicion === "Mayormente despejado") return <Sun weight="fill" className={clase} />;
  if (condicion === "Parcialmente nublado") return <CloudSun weight="fill" className={clase} />;
  if (condicion === "Niebla") return <CloudFog weight="fill" className={clase} />;
  if (condicion === "Llovizna" || condicion === "Lluvia" || condicion === "Chaparrones") return <CloudRain weight="fill" className={clase} />;
  if (condicion === "Nieve" || condicion === "Nevadas") return <Snowflake weight="fill" className={clase} />;
  if (condicion.startsWith("Tormenta")) return <CloudLightning weight="fill" className={clase} />;
  return <Cloud weight="fill" className={clase} />;
}

/** El tiempo de ahora en San Juan, en el lugar de la nota de ejemplo de clima. */
export async function ClimaCard() {
  const clima = await getClimaSanJuan();

  return (
    <article aria-label={clima ? `Clima en San Juan: ${clima.condicion}, ${clima.temperatura} grados` : "Clima en San Juan"} className="h-full rounded-2xl border border-line bg-white">
      <div className="flex h-full items-center gap-3 p-3">
        <div className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded bg-ink text-white">
          {clima ? (
            <>
              <Icono condicion={clima.condicion} />
              <span className="text-2xl font-bold leading-none tracking-tight">{clima.temperatura}°</span>
            </>
          ) : (
            <Cloud weight="fill" className="size-8 text-white/70" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-hunter">Clima</p>
          <h3 className="text-base font-bold leading-snug">{clima ? clima.condicion : "San Juan"}</h3>
          <p className="text-xs text-ink/60">{detalle(clima)}</p>
        </div>
      </div>
    </article>
  );
}

/** Pastilla chica para la cabecera: temperatura, estado y ciudad. */
export async function ClimaMini() {
  const clima = await getClimaSanJuan();
  if (!clima) return null;

  return (
    <p
      aria-label={`Clima en San Juan a las ${clima.hora}: ${clima.condicion}, ${clima.temperatura} grados`}
      className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl"
    >
      <Icono condicion={clima.condicion} clase="size-4 text-hunter" />
      <span className="text-lg font-bold leading-none tabular-nums">{clima.temperatura}°</span>
      <span className="flex flex-col items-start leading-tight">
        <span>
          {clima.condicion}
          {clima.hora ? <span className="text-white/50"> · {clima.hora}</span> : null}
        </span>
        <span className="text-[10px] font-medium text-white/55">
          San Juan · {clima.minima}° / {clima.maxima}°
        </span>
      </span>
    </p>
  );
}

function detalle(clima: Clima | null) {
  if (!clima) return "El clima de San Juan no está disponible en este momento.";
  return `San Juan · ${clima.minima}° / ${clima.maxima}° · sensación ${clima.sensacion}° · viento ${clima.viento} km/h`;
}
