import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { incrustar } from "@/lib/embeds";
import { getAjustes, getVideo } from "@/lib/queries";
import { urlSitio } from "@/lib/sitio";
import { idVideoYoutube } from "@/lib/urls";

/**
 * La tarjeta que se ve al compartir un video que no tiene carátula propia: el título sobre el negro y el rojo
 * de la marca, con el botón de play. Si el video es de YouTube, usa su miniatura de fondo.
 * La dirección lleva la fecha de la última edición (?v=…), así que puede guardarse en caché sin miedo.
 */

const ANCHO = 1200;
const ALTO = 630;
const ROJO = "#e11d2a";

type Fuente = { name: string; data: ArrayBuffer; weight: 500 | 800; style: "normal" };

/** La tipografía del sitio, en los dos pesos que usa la tarjeta. Se baja una vez y queda en memoria. */
let fuentes: Promise<Fuente[]> | null = null;

async function bajarFuente(weight: Fuente["weight"]): Promise<Fuente> {
  // Sin navegador en el medio, Google Fonts entrega el archivo en TTF, que es el formato que entiende ImageResponse.
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Figtree:wght@${weight}`)).text();
  const url = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("Google Fonts no devolvió un TTF");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo bajar la tipografía (${res.status})`);
  return { name: "Figtree", data: await res.arrayBuffer(), weight, style: "normal" };
}

async function cargarFuentes() {
  fuentes ??= Promise.all([bajarFuente(800), bajarFuente(500)]);
  try {
    return await fuentes;
  } catch {
    // Si falla, la tarjeta sale igual con la tipografía por defecto y se vuelve a intentar la próxima vez.
    fuentes = null;
    return [];
  }
}

/** La miniatura de YouTube como dato embebido, o null si el video no es de YouTube o no se pudo bajar. */
async function miniaturaYoutube(incrustados: string[]) {
  for (const u of incrustados) {
    if (incrustar(u)?.proveedor !== "youtube") continue;
    const id = idVideoYoutube(u);
    if (!id) continue;
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
      if (!res.ok) return null;
      return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const [p, ajustes] = await Promise.all([getVideo(slug), getAjustes()]);
  if (!p) return new Response("No encontrado", { status: 404 });

  const [tipografia, fondo] = await Promise.all([cargarFuentes(), miniaturaYoutube(p.incrustados ?? [])]);
  const titulo = p.titulo.trim();
  const cuerpoTitulo = titulo.length <= 36 ? 92 : titulo.length <= 70 ? 76 : 62;
  const dominio = urlSitio().replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "Figtree",
        }}
      >
        {fondo ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={fondo} width={ANCHO} height={ALTO} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
        ) : null}
        {fondo ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: ANCHO,
              height: ALTO,
              display: "flex",
              backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        ) : null}

        {/* El resplandor rojo y la trama de puntos del sitio. */}
        <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <radialGradient id="resplandor" cx="190" cy="60" r="760" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={ROJO} stopOpacity={fondo ? 0.45 : 0.65} />
              <stop offset="1" stopColor={ROJO} stopOpacity="0" />
            </radialGradient>
            <pattern id="trama" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2" fill="#fff" fillOpacity="0.13" />
            </pattern>
          </defs>
          <rect width={ANCHO} height={ALTO} fill="url(#resplandor)" />
          <rect width={ANCHO} height={ALTO} fill="url(#trama)" />
        </svg>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="28" cy="27" r="13.5" fill="none" stroke="#fff" strokeWidth="6" />
                <path d="M38.5 38.5 52 52" stroke={ROJO} strokeWidth="7" strokeLinecap="round" />
              </svg>
              <div style={{ display: "flex", marginLeft: 12, fontSize: 30, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                Los Cazadores de Noticias
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: 999,
                backgroundColor: ROJO,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {ajustes.nombreVideos}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 148,
                height: 148,
                marginRight: 44,
                borderRadius: 148,
                backgroundColor: ROJO,
                boxShadow: "0 16px 50px rgba(225,29,42,0.55)",
              }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64">
                <path d="M20 10 54 32 20 54Z" fill="#fff" />
              </svg>
            </div>
            <div
              style={{
                display: "block",
                flex: 1,
                fontSize: cuerpoTitulo,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                lineClamp: 3,
              }}
            >
              {titulo}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", width: 72, height: 6, marginRight: 20, backgroundColor: ROJO }} />
              <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>Mirá el video completo</div>
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>{dominio}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: ALTO,
      fonts: tipografia.length ? tipografia : undefined,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000" },
    },
  );
}
