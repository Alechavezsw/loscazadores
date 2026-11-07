import "server-only";
import { createHmac } from "node:crypto";
import { getAnuncios, getNoticias, getVideos } from "./queries";
import { clasificarFuente } from "./fuentes";
import { SIN_DATO } from "./geo";
import { EVENTOS_ANUNCIO, esAccion } from "./stats-acciones";
import { armarPanel, diaDe, horaDe, sumarDias, type Panel } from "./stats-calculo";
import { motorStatsArchivo } from "./stats-archivo";
import { motorStatsPg } from "./stats-pg";
import { juntar, type Incremento, type MotorStats } from "./stats-motor";
import { urlPostgres } from "./store-base";
import { urlSitio } from "./sitio";
import { rutaSeccion, SECCIONES } from "./types";
import { analizarUA, type LecturaUA } from "./ua";

/**
 * Estadísticas del sitio, hechas para respetar la privacidad:
 *  - No usan cookies ni guardan direcciones IP ni textos del navegador. De la IP y el navegador sale un código
 *    anónimo que cambia todos los días (con una clave secreta del servidor), así que sirve para saber cuántas
 *    personas distintas entraron hoy pero no para seguir a nadie de un día para otro ni para identificarla.
 *  - Lo que queda guardado son solo contadores por día.
 */

const motor: MotorStats = urlPostgres() ? motorStatsPg : motorStatsArchivo;

export type Contexto = {
  ip: string;
  ua: string;
  /** Dominio con el que se pidió la página, para no contar la navegación interna como una fuente. */
  host: string;
  pais: string;
  region: string;
  ciudad: string;
};

type Evento =
  | { t: "v"; r: string; ref: string; entrada: boolean; utmSource: string; utmCampana: string }
  | { t: "l"; r: string }
  | { t: "s"; r: string; seg: number; primera: boolean }
  | { t: "a"; r: string; a: string; ad: string };

const TIEMPO_MAXIMO_S = 1800;
const MAX_EVENTOS_POR_MINUTO = 90;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ───────────────────────── validación ─────────────────────────

const ESTATICAS = new Set([
  "/",
  "/noticias",
  "/en-vivo",
  "/videos",
  "/sin-censura",
  "/si-san-juan",
  "/privacidad",
  "/terminos",
  ...SECCIONES.map(rutaSeccion),
]);

/** Solo páginas que existen. Cualquier otra dirección se junta en "/otras" para que nadie llene la base de rutas inventadas. */
async function normalizarRuta(crudo: unknown): Promise<string | null> {
  if (typeof crudo !== "string" || crudo.length > 160) return null;
  let r = crudo.split(/[?#]/)[0];
  if (!/^\/[A-Za-z0-9\-_.~%/]*$/.test(r)) return null;
  r = r.toLowerCase();
  if (r.length > 1) r = r.replace(/\/+$/, "");
  if (ESTATICAS.has(r)) return r;

  // /videos es el nombre anterior de /sin-censura y sigue andando: las dos cuentan como páginas de videos.
  const m = r.match(/^\/(noticias|videos|sin-censura)\/([a-z0-9-]{1,100})$/);
  if (m) {
    const slugs = m[1] === "noticias" ? (await getNoticias()).map((n) => n.slug) : (await getVideos()).map((p) => p.slug);
    if (slugs.includes(m[2])) return r;
  }
  return "/otras";
}

async function limpiar(crudo: unknown): Promise<Evento | null> {
  if (!crudo || typeof crudo !== "object") return null;
  const e = crudo as Record<string, unknown>;
  const t = e.t;
  if (t !== "v" && t !== "l" && t !== "s" && t !== "a") return null;
  const r = await normalizarRuta(e.r);
  if (!r) return null;

  if (t === "l") return { t, r };

  if (t === "s") {
    const seg = Math.round(Number(e.seg));
    if (!Number.isFinite(seg) || seg < 1) return null;
    return { t, r, seg: Math.min(seg, TIEMPO_MAXIMO_S), primera: e.n === 1 };
  }

  if (t === "a") {
    const a = texto(e.a, 40);
    const ad = texto(e.ad, 16);
    if ((EVENTOS_ANUNCIO as readonly string[]).includes(a)) {
      if (!/^[a-f0-9]{8}$/.test(ad)) return null;
      // Solo anuncios que existen y están activos.
      if (!(await getAnuncios()).some((x) => x.id === ad)) return null;
      return { t, r, a, ad };
    }
    return esAccion(a) ? { t, r, a, ad: "" } : null;
  }

  // Del sitio de origen solo se guarda el nombre del dominio.
  const ref = texto(e.ref, 100).toLowerCase();
  const u = e.u && typeof e.u === "object" ? (e.u as Record<string, unknown>) : {};
  return {
    t,
    r,
    ref: /^[a-z0-9.\-:/_]*$/.test(ref) ? ref : "",
    entrada: e.e === 1,
    utmSource: texto(u.s, 40).replace(/[^\w\- .]/g, ""),
    utmCampana: texto(u.c, 40).replace(/[^\w\- .]/g, ""),
  };
}

// ───────────────────────── identidad anónima y freno ─────────────────────────

function idVisitante(dia: string, ip: string, ua: string) {
  const sal = process.env.STATS_SALT || process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "lc-stats";
  return createHmac("sha256", `${sal}|${dia}`).update(`${ip}|${ua}`).digest("base64url").slice(0, 16);
}

declare global {
  var __lcRitmo: Map<string, { t: number; n: number }> | undefined;
}

/** Freno simple: un mismo visitante no puede mandar más de 90 avisos por minuto. */
function pasaDeRitmo(id: string, ahora: number) {
  const ritmo = (globalThis.__lcRitmo ??= new Map());
  if (ritmo.size > 20_000) ritmo.clear();
  const r = ritmo.get(id);
  if (!r || ahora - r.t > 60_000) {
    ritmo.set(id, { t: ahora, n: 1 });
    return false;
  }
  r.n++;
  return r.n > MAX_EVENTOS_POR_MINUTO;
}

// ───────────────────────── registrar ─────────────────────────

function lugar(ctx: Contexto) {
  let ciudad = ctx.ciudad;
  try {
    ciudad = decodeURIComponent(ciudad);
  } catch {
    /* se deja como vino */
  }
  const pais = /^[A-Za-z]{2}$/.test(ctx.pais) ? ctx.pais.toUpperCase() : "??";
  const region = (ctx.region.split("-").pop() ?? "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
  return { pais, region, ciudad: ciudad.replace(/[\u0000-\u001f]/g, "").slice(0, 60) };
}

/** Anota un aviso del navegador. Todo lo raro se descarta sin avisar: esto lo puede llamar cualquiera. */
export async function registrarEvento(crudo: unknown, ctx: Contexto, lectura: LecturaUA = analizarUA(ctx.ua)): Promise<void> {
  const ev = await limpiar(crudo);
  if (!ev) return;

  const ahora = Date.now();
  const dia = diaDe(ahora);
  const id = idVisitante(dia, ctx.ip, ctx.ua);
  if (pasaDeRitmo(id, ahora)) return;

  const inc: Incremento[] = [];

  if (ev.t === "s") {
    inc.push(["ruta_seg", ev.r, ev.seg], ["t", "seg", ev.seg]);
    if (ev.primera) inc.push(["ruta_n", ev.r, 1], ["t", "seg_n", 1]);
    await motor.sumar(dia, juntar(inc));
    return;
  }

  const nuevo = await motor.tocar({ dia, id, ruta: ev.r, ahora });
  if (nuevo) {
    const { pais, region, ciudad } = lugar(ctx);
    inc.push(["t", "visitantes", 1], ["disp", lectura.dispositivo, 1], ["nav", lectura.navegador, 1], ["so", lectura.so, 1], ["pais", pais, 1]);
    // Dentro de Argentina se llega hasta provincia y ciudad; del resto del mundo, solo el país.
    if (pais === "AR") {
      if (region) inc.push(["prov", `AR-${region}`, 1]);
      if (ciudad) inc.push(["ciudad", ciudad, 1]);
    }
  }

  if (ev.t === "v") {
    inc.push(["t", "vistas", 1], ["h", horaDe(ahora), 1], ["ruta", ev.r, 1]);
    if (ev.entrada) {
      const propios = [ctx.host.split(":")[0]];
      try {
        propios.push(new URL(urlSitio()).hostname);
      } catch {
        /* sin dirección pública configurada */
      }
      const f = clasificarFuente(ev.ref, ev.utmSource, propios);
      if (f) {
        inc.push(["t", "entradas", 1], ["fuente", f.fuente, 1]);
        if (f.host) inc.push(["ref", f.host, 1]);
        if (ev.utmCampana) inc.push(["campana", ev.utmCampana, 1]);
      }
    }
  } else if (ev.t === "a") {
    if (ev.ad) inc.push([ev.a === "anuncio-vista" ? "adv" : "adc", ev.ad, 1]);
    else inc.push(["accion", ev.a, 1]);
  }

  await motor.sumar(dia, juntar(inc));
}

// ───────────────────────── lectura para el panel ─────────────────────────

/** El panel del período que termina hoy (hora de San Juan), con el período anterior de igual largo para comparar. */
export async function leerPanel(dias: number): Promise<Panel> {
  const hoy = diaDe(Date.now());
  const filas = await motor.leer(sumarDias(hoy, -(2 * dias - 1)), hoy);
  return armarPanel(filas, hoy, dias);
}

/** Quiénes están en el sitio ahora: se considera conectado a quien dio señales en los últimos 3 minutos. */
export async function leerActivos() {
  const activos = await motor.activos(Date.now() - 3 * 60_000);
  const porRuta = new Map<string, number>();
  for (const a of activos) porRuta.set(a.ruta || SIN_DATO, (porRuta.get(a.ruta || SIN_DATO) ?? 0) + 1);
  return {
    total: activos.length,
    rutas: [...porRuta].map(([ruta, n]) => ({ ruta, n })).sort((a, b) => b.n - a.n),
  };
}
