import "server-only";
import { motorArchivo } from "./store-archivo";
import { motorPg } from "./store-pg";
import { seed, urlPostgres, type Motor } from "./store-base";
import type { Db } from "./types";

export { AJUSTES_BASE, DATA_DIR, UPLOADS_DIR, newId, slugify } from "./store-base";

/**
 * Donde viven los datos depende del entorno: con una base Postgres configurada (DATABASE_URL, que la
 * integración de Neon en Vercel define sola) se usa esa; si no, un archivo db.json en la carpeta de datos.
 */
const motor: Motor = urlPostgres() ? motorPg : motorArchivo;

export const usaPostgres = () => motor === motorPg;

/** Lee todo. Mientras no se haya guardado nada, devuelve el contenido de muestra sin escribirlo. */
export async function readDb(): Promise<Db> {
  return (await motor.leer()) ?? seed();
}

/** Lee solo ajustes y conexiones. Úsese cuando no hacen falta las noticias. */
export async function readConfig() {
  const config = await motor.leerConfig();
  if (config) return config;
  const { ajustes, meta } = seed();
  return { ajustes, meta };
}

/** Aplica un cambio sobre la base, uno a la vez, y lo guarda completo o no lo guarda. */
export function mutateDb<T>(cambio: (db: Db) => T | Promise<T>): Promise<T> {
  return motor.mutar(cambio);
}
