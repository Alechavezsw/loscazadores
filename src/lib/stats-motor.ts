import type { Fila } from "./stats-calculo";

/** [dimensión, clave, cuánto sumar] */
export type Incremento = [dim: string, clave: string, n: number];

export type Visita = { dia: string; id: string; ruta: string; ahora: number };

export type Activo = { id: string; ruta: string; ultimo: number };

/** Contrato que cumplen los dos almacenamientos de estadísticas (archivo y Postgres). */
export type MotorStats = {
  /** Anota que ese visitante está activo ahora. Devuelve true si es la primera vez que se lo ve en el día. */
  tocar(v: Visita): Promise<boolean>;
  /** Suma a los contadores del día. */
  sumar(dia: string, incrementos: Incremento[]): Promise<void>;
  /** Todos los contadores de los días entre `desde` y `hasta`, ambos incluidos. */
  leer(desde: string, hasta: string): Promise<Fila[]>;
  /** Visitantes vistos desde ese momento (milisegundos). */
  activos(desdeMs: number): Promise<Activo[]>;
};

/** Junta repetidos para no pedirle a la base dos veces el mismo contador. */
export function juntar(incrementos: Incremento[]): Incremento[] {
  const m = new Map<string, Incremento>();
  for (const [dim, clave, n] of incrementos) {
    const k = `${dim}\u0000${clave}`;
    const previo = m.get(k);
    if (previo) previo[2] += n;
    else m.set(k, [dim, clave, n]);
  }
  return [...m.values()];
}
