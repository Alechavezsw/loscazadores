import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from "@phosphor-icons/react/ssr";
import { getClimaSanJuan, type Clima } from "@/lib/clima";

function Icono({ condicion }: { condicion: string }) {
  const clase = "size-8";
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

function detalle(clima: Clima | null) {
  if (!clima) return "El clima de San Juan no está disponible en este momento.";
  return `San Juan · ${clima.minima}° / ${clima.maxima}° · sensación ${clima.sensacion}° · viento ${clima.viento} km/h`;
}
