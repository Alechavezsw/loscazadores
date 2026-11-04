import { cacheLife } from "next/cache";

/** Centro de la ciudad de San Juan. */
const SAN_JUAN = { lat: -31.5375, lon: -68.5364 };

export type Clima = {
  temperatura: number;
  sensacion: number;
  minima: number;
  maxima: number;
  viento: number;
  condicion: string;
};

type Respuesta = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

/** Texto corto para el código del tiempo de Open-Meteo. */
export function condicionDelCodigo(codigo: number): string {
  if (codigo === 0) return "Despejado";
  if (codigo === 1) return "Mayormente despejado";
  if (codigo === 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Niebla";
  if (codigo === 51 || codigo === 53 || codigo === 55 || codigo === 56 || codigo === 57) return "Llovizna";
  if (codigo === 61 || codigo === 63 || codigo === 65 || codigo === 66 || codigo === 67) return "Lluvia";
  if (codigo === 71 || codigo === 73 || codigo === 75 || codigo === 77) return "Nieve";
  if (codigo === 80 || codigo === 81 || codigo === 82) return "Chaparrones";
  if (codigo === 85 || codigo === 86) return "Nevadas";
  if (codigo === 95) return "Tormenta";
  if (codigo === 96 || codigo === 99) return "Tormenta con granizo";
  return "Nublado";
}

/** El tiempo actual en San Juan. Se renueva solo, sin pasar por el panel. */
export async function getClimaSanJuan(): Promise<Clima | null> {
  "use cache";
  cacheLife("minutes");

  const params = new URLSearchParams({
    latitude: String(SAN_JUAN.lat),
    longitude: String(SAN_JUAN.lon),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "America/Argentina/San_Juan",
    forecast_days: "1",
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Respuesta;
    const actual = data.current;
    if (
      actual?.temperature_2m == null ||
      actual.apparent_temperature == null ||
      actual.weather_code == null ||
      actual.wind_speed_10m == null
    ) {
      return null;
    }
    return {
      temperatura: Math.round(actual.temperature_2m),
      sensacion: Math.round(actual.apparent_temperature),
      minima: Math.round(data.daily?.temperature_2m_min?.[0] ?? actual.temperature_2m),
      maxima: Math.round(data.daily?.temperature_2m_max?.[0] ?? actual.temperature_2m),
      viento: Math.round(actual.wind_speed_10m),
      condicion: condicionDelCodigo(actual.weather_code),
    };
  } catch {
    return null;
  }
}
