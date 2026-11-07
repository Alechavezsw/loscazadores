import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "@phosphor-icons/react/ssr";
import { AutoRefresco } from "@/components/admin/stats/AutoRefresco";
import { fechaCorta, fechaLarga, duracion, numero, porcentaje } from "@/components/admin/stats/formato";
import { GraficoSerie, type Punto } from "@/components/admin/stats/GraficoSerie";
import { RANGOS, rangoDe } from "@/components/admin/stats/rangos";
import { Ranking, type ItemRanking } from "@/components/admin/stats/Ranking";
import { Tile } from "@/components/admin/stats/Tile";
import { tarjeta, TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { nombrePais, nombreProvincia, SIN_DATO } from "@/lib/geo";
import { ACCIONES, esAccion } from "@/lib/stats-acciones";
import { promedio, variacion } from "@/lib/stats-calculo";
import { leerActivos, leerPanel } from "@/lib/stats";
import { readDb } from "@/lib/store";
import { rutaSeccion, SECCIONES, SLOT_NOMBRE } from "@/lib/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Estadísticas" };

// Lee la sesión y los números en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

const FIJAS: Record<string, string> = {
  "/": "Portada",
  "/noticias": "Archivo de noticias",
  "/en-vivo": "En vivo",
  "/videos": "Videos (la sección)",
  "/viva-feria": "Viva Feria",
  "/si-san-juan": "Servicios",
  ...Object.fromEntries(SECCIONES.map((s) => [rutaSeccion(s), `Sección: ${s.nombre}`])),
  "/sin-censura": "Videos (dirección anterior)",
  "/privacidad": "Privacidad",
  "/terminos": "Términos",
  "/otras": "Otras páginas",
};

function Seccion({ titulo, bajada, children, className }: { titulo: string; bajada?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(tarjeta, "viz flex min-w-0 flex-col gap-4", className)}>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{titulo}</h2>
        {bajada ? <p className="mt-0.5 text-sm text-[var(--viz-tinta-2)]">{bajada}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function Estadisticas({ searchParams }: PageProps<"/admin/estadisticas">) {
  await requerirAdmin();
  const { dias: pedido } = await searchParams;
  const rango = rangoDe(pedido);

  const [panel, activos, db] = await Promise.all([leerPanel(rango.dias), leerActivos(), readDb()]);
  const t = panel.totales;
  const p = panel.previo;

  const noticias = new Map(db.noticias.map((n) => [n.slug, n]));
  const piezas = new Map(db.sinCensura.map((x) => [x.slug, x]));

  const nombreDe = (ruta: string) => {
    if (FIJAS[ruta]) return FIJAS[ruta];
    const [, seccion, slug] = ruta.split("/");
    if (seccion === "noticias") return noticias.get(slug)?.titulo ?? "Noticia eliminada";
    if (seccion === "videos") return `Videos: ${piezas.get(slug)?.titulo ?? "video eliminado"}`;
    return ruta;
  };
  const enlaceDe = (ruta: string) => (ruta === "/otras" ? undefined : ruta);

  const tiempo = (seg: number, n: number) => (n > 0 ? `Lee ${duracion(seg / n)}` : undefined);

  // Páginas: todas, y las notas y piezas por separado.
  const paginas: ItemRanking[] = panel.paginas.slice(0, 10).map((x) => ({
    etiqueta: nombreDe(x.ruta),
    valor: x.vistas,
    detalle: tiempo(x.seg, x.lecturas),
    href: enlaceDe(x.ruta),
  }));
  const notas: ItemRanking[] = panel.paginas
    .filter((x) => x.ruta.startsWith("/noticias/"))
    .slice(0, 8)
    .map((x) => {
      const n = noticias.get(x.ruta.split("/")[2]);
      return {
        etiqueta: nombreDe(x.ruta),
        valor: x.vistas,
        detalle: [n?.categoria, tiempo(x.seg, x.lecturas)].filter(Boolean).join(" · ") || undefined,
        href: x.ruta,
      };
    });
  const sinCensura: ItemRanking[] = panel.paginas
    .filter((x) => x.ruta.startsWith("/videos/"))
    .slice(0, 5)
    .map((x) => ({
      etiqueta: nombreDe(x.ruta).replace(/^Videos: /, ""),
      valor: x.vistas,
      detalle: tiempo(x.seg, x.lecturas),
      href: x.ruta,
    }));

  const fuentes = panel.fuentes.map((x) => ({ etiqueta: x.clave, valor: x.valor }));
  const sumaFuentes = fuentes.reduce((s, x) => s + x.valor, 0);
  const referentes = panel.referentes.slice(0, 8).map((x) => ({ etiqueta: x.clave, valor: x.valor }));
  const campanas = panel.campanas.slice(0, 5).map((x) => ({ etiqueta: x.clave, valor: x.valor }));

  const lista = (pares: { clave: string; valor: number }[], tope = 6, nombre?: (c: string) => string): ItemRanking[] =>
    pares.slice(0, tope).map((x) => ({ etiqueta: nombre ? nombre(x.clave) : x.clave, valor: x.valor }));
  const suma = (pares: { valor: number }[]) => pares.reduce((s, x) => s + x.valor, 0);

  const acciones: ItemRanking[] = panel.acciones
    .filter((x) => esAccion(x.clave))
    .map((x) => ({ etiqueta: ACCIONES[x.clave as keyof typeof ACCIONES], valor: x.valor }));

  const hayUbicacion = panel.provincias.length > 0 || panel.paises.some((x) => x.clave !== "??");

  // Gráficos
  const puntosSerie: Punto[] =
    rango.dias === 1
      ? panel.serie.map((x) => ({ etiqueta: `${Number(x.clave)} h`, titulo: `De ${x.clave} a ${String((Number(x.clave) + 1) % 24).padStart(2, "0")} h`, valor: x.vistas }))
      : panel.serie.map((x) => ({ etiqueta: fechaCorta(x.clave), titulo: fechaLarga(x.clave), valor: x.vistas, linea: x.visitantes }));
  const porHora: Punto[] = panel.porHora.map((x) => ({
    etiqueta: `${Number(x.clave)} h`,
    titulo: `De ${x.clave} a ${String((Number(x.clave) + 1) % 24).padStart(2, "0")} h`,
    valor: x.vistas,
  }));
  const porSemana: Punto[] = panel.porSemana.map((x) => ({ etiqueta: x.clave.slice(0, 3), titulo: x.clave, valor: x.valor }));

  // Publicidad: todos los anuncios cargados, con o sin datos.
  const datosAd = new Map(panel.anuncios.map((a) => [a.id, a]));
  const anuncios = db.anuncios
    .map((a) => ({ a, vistas: datosAd.get(a.id)?.vistas ?? 0, clics: datosAd.get(a.id)?.clics ?? 0 }))
    .sort((x, y) => y.vistas - x.vistas || y.clics - x.clics);

  const ppv = promedio(t.vistas, t.visitantes);
  const ppvPrevio = promedio(p.vistas, p.visitantes);
  const segPorPagina = promedio(t.seg, t.segN);
  const segPrevio = promedio(p.seg, p.segN);
  const esHoy = rango.dias === 1;

  const comparar = (actual: number, previo: number) => (esHoy ? undefined : variacion(actual, previo));
  const nota = (texto: string) => (esHoy ? texto : undefined);

  const periodo = esHoy ? "hoy" : `del ${fechaCorta(panel.desde)} al ${fechaCorta(panel.hasta)}`;

  return (
    <>
      <AutoRefresco />
      <TituloPagina titulo="Estadísticas" bajada={`Quién entra al sitio y qué hace, ${periodo}. Todo en hora de San Juan.`} />

      {/* Un solo renglón de filtros arriba: todo lo de abajo se calcula sobre este período. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Período" className="inline-flex rounded-full border border-line bg-white p-1">
          {RANGOS.map((r) => (
            <Link
              key={r.id}
              href={`/admin/estadisticas?dias=${r.id}`}
              aria-current={r.id === rango.id ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
                r.id === rango.id ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
              )}
            >
              {r.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="viz flex items-center gap-3 rounded-full border border-line bg-white py-1.5 pl-3 pr-4 text-sm" role="status">
          <span aria-hidden className="relative flex size-2.5">
            <span className={cn("absolute inset-0 rounded-full bg-wa", activos.total > 0 && "animate-pulse-ring")} />
            <span className={cn("relative size-2.5 rounded-full", activos.total > 0 ? "bg-wa" : "bg-ink/25")} />
          </span>
          <span>
            <strong className="font-semibold">{numero(activos.total)}</strong>{" "}
            <span className="text-[var(--viz-tinta-2)]">{activos.total === 1 ? "persona en el sitio ahora" : "personas en el sitio ahora"}</span>
            {activos.rutas[0] ? <span className="text-[var(--viz-tinta-2)]"> · sobre todo en {nombreDe(activos.rutas[0].ruta)}</span> : null}
          </span>
        </div>
      </div>

      {!panel.hayDatos ? (
        <div className={cn(tarjeta, "mb-6 flex items-start gap-3")}>
          <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-ink/50" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">Todavía no hay visitas registradas en este período.</p>
            <p className="mt-1 text-ink/70">
              Se empiezan a contar apenas alguien abre una página pública del sitio. Las que hagas vos con la sesión del panel iniciada no se cuentan.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {/* Lo más importante, arriba de todo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Tile
            principal
            className="sm:col-span-2"
            etiqueta="Visitantes"
            valor={numero(t.visitantes)}
            variacion={comparar(t.visitantes, p.visitantes)}
            contra={rango.previo}
            nota={nota(`Ayer: ${numero(p.visitantes)}`)}
          />
          <Tile
            etiqueta="Vistas de página"
            valor={numero(t.vistas)}
            variacion={comparar(t.vistas, p.vistas)}
            contra={rango.previo}
            nota={nota(`Ayer: ${numero(p.vistas)}`)}
          />
          <Tile
            etiqueta="Páginas por visita"
            valor={t.visitantes > 0 ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(ppv) : "—"}
            variacion={comparar(ppv, ppvPrevio)}
            contra={rango.previo}
            nota={nota(ppvPrevio > 0 ? `Ayer: ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(ppvPrevio)}` : "")}
          />
          <Tile
            etiqueta="Tiempo en cada página"
            valor={duracion(segPorPagina)}
            variacion={comparar(segPorPagina, segPrevio)}
            contra={rango.previo}
            nota={nota(segPrevio > 0 ? `Ayer: ${duracion(segPrevio)}` : "")}
          />
        </div>

        <Seccion
          titulo={esHoy ? "Vistas de página por hora" : "Visitas por día"}
          bajada={esHoy ? "Cada columna es una hora de hoy." : "Las columnas son las vistas de página de cada día y la línea, las personas distintas que entraron."}
        >
          <GraficoSerie
            puntos={puntosSerie}
            nombre="Vistas de página"
            nombreLinea={esHoy ? undefined : "Visitantes"}
            marcasX={esHoy ? 8 : 6}
          />
        </Seccion>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Páginas más vistas" bajada="Con cuánto tiempo se queda la gente en cada una.">
            <Ranking items={paginas} total={t.vistas} />
          </Seccion>
          <Seccion titulo="Noticias más leídas">
            <Ranking items={notas} vacio="Todavía no se leyó ninguna noticia en este período." />
          </Seccion>
        </div>

        {sinCensura.length > 0 ? (
          <Seccion titulo="Videos más vistos">
            <Ranking items={sinCensura} />
          </Seccion>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="De dónde llegan" bajada="Cuántas veces entraron al sitio desde cada lugar. «Directo» es escribir la dirección o abrirlo desde un marcador.">
            <Ranking items={fuentes} total={sumaFuentes} />
          </Seccion>
          <Seccion titulo="Sitios que nos mandan gente" bajada="El nombre de la página desde la que hicieron clic.">
            <Ranking items={referentes} vacio="Todavía no llegó nadie desde otro sitio." />
            {campanas.length > 0 ? (
              <div className="border-t border-[var(--viz-grilla)] pt-4">
                <h3 className="mb-3 text-sm font-semibold">Campañas (enlaces con utm_campaign)</h3>
                <Ranking items={campanas} />
              </div>
            ) : null}
          </Seccion>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Seccion titulo="Aparato">
            <Ranking items={lista(panel.dispositivos)} total={suma(panel.dispositivos)} />
          </Seccion>
          <Seccion titulo="Navegador" bajada="Instagram y Facebook (app) son los navegadores que traen esas redes por dentro.">
            <Ranking items={lista(panel.navegadores)} total={suma(panel.navegadores)} />
          </Seccion>
          <Seccion titulo="Sistema">
            <Ranking items={lista(panel.sistemas)} total={suma(panel.sistemas)} />
          </Seccion>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Seccion titulo="Provincias" bajada="Dentro de Argentina.">
            <Ranking
              items={lista(panel.provincias, 8, nombreProvincia)}
              total={suma(panel.provincias)}
              vacio={hayUbicacion ? "Sin datos de provincia en este período." : "La ubicación se detecta en el sitio publicado en Vercel; en tu computadora no hay datos."}
            />
          </Seccion>
          <Seccion titulo="Ciudades" bajada="Dentro de Argentina.">
            <Ranking items={lista(panel.ciudades, 8)} total={suma(panel.ciudades)} vacio="Sin datos de ciudad en este período." />
          </Seccion>
          <Seccion titulo="Países">
            <Ranking
              items={lista(panel.paises.filter((x) => x.clave !== "??" || panel.paises.length === 1), 6, nombrePais)}
              total={suma(panel.paises)}
              vacio={SIN_DATO}
            />
          </Seccion>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="A qué hora nos leen" bajada="Las vistas de todo el período, según la hora del día.">
            <GraficoSerie puntos={porHora} nombre="Vistas de página" marcasX={8} alto={176} />
          </Seccion>
          {rango.dias >= 7 ? (
            <Seccion titulo="Qué días nos leen" bajada="Las vistas de todo el período, según el día de la semana.">
              <GraficoSerie puntos={porSemana} nombre="Vistas de página" marcasX={7} alto={176} />
            </Seccion>
          ) : null}
        </div>

        <Seccion titulo="Qué hacen en el sitio" bajada="Clics en los botones y enlaces importantes, y cuánta gente puso la radio.">
          <Ranking items={acciones} vacio="Todavía no hicieron clic en ningún botón medido en este período." />
        </Seccion>

        <Seccion titulo="Publicidad" bajada="Un anuncio cuenta como visto cuando se vio la mitad en pantalla durante un segundo. El porcentaje de clics es clics sobre vistas.">
          {anuncios.length === 0 ? (
            <p className="py-2 text-sm text-[var(--viz-tinta-2)]">Todavía no cargaste anuncios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs text-[var(--viz-tinta-2)]">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Anuncio
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">
                      Vistas
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">
                      Clics
                    </th>
                    <th scope="col" className="py-2 pl-4 text-right font-semibold">
                      Clics sobre vistas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {anuncios.map(({ a, vistas, clics }) => (
                    <tr key={a.id} className="border-t border-[var(--viz-grilla)]">
                      <th scope="row" className="py-2.5 pr-4 font-normal">
                        <span className="block font-semibold">{a.titulo || "Sin nombre"}</span>
                        <span className="text-xs text-[var(--viz-tinta-2)]">
                          {SLOT_NOMBRE[a.slot]} · {a.activo ? "Activo" : "Pausado"}
                        </span>
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums">{numero(vistas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{numero(clics)}</td>
                      <td className="py-2.5 pl-4 text-right tabular-nums">{vistas > 0 ? porcentaje(clics / vistas, 1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        <aside className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-sm text-ink/70">
          <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-ink/40" aria-hidden />
          <div className="flex flex-col gap-2">
            <p>
              <strong className="font-semibold text-ink">Cómo se cuenta.</strong> Las estadísticas no usan cookies ni guardan direcciones IP: de cada visita
              sale un código anónimo que cambia todos los días, y de ahí solo quedan contadores. Por eso alguien que vuelve otro día cuenta como un
              visitante nuevo, y los visitantes de varios días son la suma de los de cada día.
            </p>
            <p>
              No se cuentan los robots ni lo que hacés vos con la sesión del panel iniciada. Las vistas y los clics se anotan desde el navegador, así que
              alguien con un bloqueador de rastreadores puede no aparecer.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
