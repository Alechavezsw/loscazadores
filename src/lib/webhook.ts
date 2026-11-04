import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Clave del aviso entrante. Se muestra una sola vez al generarla y en la base queda solo su huella,
 * así que ni leyendo data/db.json se puede usar para mandar avisos.
 */

export function nuevaClave() {
  return `lcw_${randomBytes(24).toString("base64url")}`;
}

export function huella(clave: string) {
  return createHash("sha256").update(clave).digest("hex");
}

export function claveValida(clave: string, huellaGuardada: string | null) {
  if (!clave || !huellaGuardada) return false;
  const a = Buffer.from(huella(clave), "hex");
  const b = Buffer.from(huellaGuardada, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
