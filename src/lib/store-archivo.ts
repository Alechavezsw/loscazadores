import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { completar, DATA_DIR, seed, type Motor } from "./store-base";
import type { Db } from "./types";

/** Motor de archivos: un db.json en la carpeta de datos. Es el de la computadora y el de un servidor con disco propio. */

const DB_FILE = path.join(DATA_DIR, "db.json");

async function leer(): Promise<Db | null> {
  try {
    return completar(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Db>);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

let cola: Promise<unknown> = Promise.resolve();

export const motorArchivo: Motor = {
  leer,

  async leerConfig() {
    const db = await leer();
    return db ? { ajustes: db.ajustes, meta: db.meta } : null;
  },

  mutar(cambio) {
    const tarea = cola.then(async () => {
      const db = (await leer()) ?? seed();
      const resultado = await cambio(db);
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, DB_FILE);
      return resultado;
    });
    cola = tarea.catch(() => undefined);
    return tarea;
  },
};
