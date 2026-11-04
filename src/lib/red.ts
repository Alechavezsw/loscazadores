import "server-only";
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { isIP } from "node:net";

/**
 * Descargas hacia afuera (feeds y fotos). Como la dirección la define quien carga el feed o manda
 * el aviso, se bloquea todo lo que apunte a la red interna del servidor.
 */

export class ErrorRed extends Error {}

/** Solo para pruebas locales: nombres de host que se aceptan aunque sean internos o http. */
function hostsLocales() {
  return (process.env.PERMITIR_HOSTS_LOCALES ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

function ipv4Interna(ip: string) {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function ipInterna(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return ipv4Interna(ip);
  if (version !== 6) return true;

  const l = ip.toLowerCase();
  if (l === "::" || l === "::1") return true;
  if (l.startsWith("::ffff:")) {
    const resto = l.slice(7);
    if (resto.includes(".")) return ipv4Interna(resto);
    const grupos = resto.split(":").map((g) => parseInt(g, 16));
    if (grupos.length === 2 && grupos.every((g) => !Number.isNaN(g))) {
      return ipv4Interna(`${grupos[0] >> 8}.${grupos[0] & 255}.${grupos[1] >> 8}.${grupos[1] & 255}`);
    }
    return true;
  }
  return /^f[cd]/.test(l) || /^fe[89ab]/.test(l) || l.startsWith("ff");
}

async function validarDestino(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (hostsLocales().includes(host)) return;

  if (u.protocol !== "https:") throw new ErrorRed("Solo se aceptan enlaces https.");
  if (u.username || u.password) throw new ErrorRed("El enlace no puede llevar usuario ni contraseña.");
  if (u.port) throw new ErrorRed("El enlace no puede usar un puerto especial.");
  if (host === "localhost" || /\.(localhost|local|internal|lan)$/.test(host)) {
    throw new ErrorRed("Ese enlace apunta a una dirección interna.");
  }

  if (isIP(host)) {
    if (ipInterna(host)) throw new ErrorRed("Ese enlace apunta a una dirección interna.");
    return;
  }

  let destinos: LookupAddress[];
  try {
    destinos = await lookup(host, { all: true });
  } catch {
    throw new ErrorRed("No se pudo encontrar ese sitio. Revisá que el enlace esté bien escrito.");
  }
  if (destinos.some((d) => ipInterna(d.address))) throw new ErrorRed("Ese enlace apunta a una dirección interna.");
}

type Opciones = { maxBytes: number; timeoutMs?: number; accept?: string };

/** Descarga una URL pública, validando cada salto de redirección y cortando si pasa del tamaño permitido. */
export async function fetchPublico(url: string, { maxBytes, timeoutMs = 20_000, accept = "*/*" }: Opciones) {
  let actual = url;

  for (let salto = 0; salto <= 3; salto++) {
    let u: URL;
    try {
      u = new URL(actual);
    } catch {
      throw new ErrorRed("El enlace no es válido.");
    }
    await validarDestino(u);

    let res: Response;
    try {
      res = await fetch(u, {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept, "user-agent": "LosCazadoresBot/1.0 (importador de publicaciones)" },
      });
    } catch {
      throw new ErrorRed("No se pudo comunicar con ese sitio. Probá de nuevo en un rato.");
    }

    const destino = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && destino) {
      actual = new URL(destino, u).toString();
      continue;
    }
    if (!res.ok) throw new ErrorRed(`Ese sitio respondió con el estado ${res.status}.`);

    const declarado = Number(res.headers.get("content-length") ?? 0);
    if (declarado > maxBytes) throw new ErrorRed("El archivo es demasiado grande.");

    const trozos: Uint8Array[] = [];
    let total = 0;
    const lector = res.body?.getReader();
    if (!lector) throw new ErrorRed("Ese sitio devolvió una respuesta vacía.");
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await lector.cancel();
        throw new ErrorRed("El archivo es demasiado grande.");
      }
      trozos.push(value);
    }
    return {
      tipo: (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(),
      datos: Buffer.concat(trozos),
    };
  }

  throw new ErrorRed("Ese enlace redirige demasiadas veces.");
}
