import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react/ssr";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { botonPrimario, botonSecundario, Mensaje, tarjeta, TituloPagina } from "@/components/admin/ui";
import { Photo } from "@/components/site/Brand";
import { EnVivoInsignia } from "@/components/site/LiveSection";
import { requerirAdmin } from "@/lib/auth";
import { fechaBreve } from "@/lib/format";
import { getLiveStatus } from "@/lib/live";
import { leerActivos, leerPanel } from "@/lib/stats";
import { readDb } from "@/lib/store";
import { borrarEjemplos } from "../actions";

export const metadata: Metadata = { title: "Resumen" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

const MOTIVOS: Record<string, string> = {
  "en-vivo": "El canal está transmitiendo ahora.",
  manual: "Se muestra el video que cargaste a mano.",
  "sin-transmision": "El canal no está transmitiendo en este momento.",
  "sin-canal": "Todavía no cargaste el canal de YouTube.",
  apagado: "La transmisión está apagada en Ajustes.",
  error: "YouTube no respondió. Se vuelve a intentar solo.",
};

export default async function Resumen() {
  await requerirAdmin();
  const db = await readDb();
  const live = await getLiveStatus(db.ajustes);
  // Si las estadísticas fallan (por ejemplo, la base no responde), el resumen igual se muestra.
  const [visitasHoy, activos] = await Promise.all([leerPanel(1).catch(() => null), leerActivos().catch(() => null)]);

  const publicadas = db.noticias.filter((n) => n.publicada).length;
  const borradores = db.noticias.length - publicadas;
  const urgentes = db.noticias.filter((n) => n.publicada && n.urgente).length;
  const anunciosActivos = db.anuncios.filter((a) => a.activo).length;
  const ejemplos = db.noticias.filter((n) => n.ejemplo).length + db.sinCensura.filter((p) => p.ejemplo).length;
  const ultimas = [...db.noticias].sort((a, b) => b.actualizada.localeCompare(a.actualizada)).slice(0, 5);

  const datos = [
    { etiqueta: "Publicadas", valor: publicadas },
    { etiqueta: "Borradores", valor: borradores },
    { etiqueta: "Última hora", valor: urgentes },
    { etiqueta: "Anuncios activos", valor: anunciosActivos },
  ];

  return (
    <>
      <TituloPagina titulo="Resumen" bajada="Lo que está publicado ahora y lo que viene.">
        <Link href="/semiton/noticias/nueva" className={botonPrimario}>
          <Plus weight="bold" className="size-5" aria-hidden />
          Nueva noticia
        </Link>
      </TituloPagina>

      <div className="flex flex-col gap-6">
        {ejemplos > 0 ? (
          <section className={`${tarjeta} flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <h2 className="text-lg font-bold">Hay {ejemplos} {ejemplos === 1 ? "contenido de ejemplo" : "contenidos de ejemplo"}</h2>
              <p className="text-sm text-ink/70">
                Son noticias, notas y videos que cargamos para que veas cómo queda el sitio. Borralos antes de publicarlo.
              </p>
            </div>
            <form action={borrarEjemplos}>
              <ConfirmButton etiqueta="Borrar ejemplos" pregunta="¿Borrar todos los ejemplos?" />
            </form>
          </section>
        ) : null}

        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {datos.map((d) => (
            <div key={d.etiqueta} className={tarjeta}>
              <dt className="text-sm font-semibold text-ink/60">{d.etiqueta}</dt>
              <dd className="mt-1 text-4xl font-bold tracking-tight">{d.valor}</dd>
            </div>
          ))}
        </dl>

        {visitasHoy && activos ? (
          <section aria-labelledby="visitas-hoy" className={`${tarjeta} flex flex-wrap items-center justify-between gap-x-8 gap-y-4`}>
            <div>
              <h2 id="visitas-hoy" className="text-lg font-bold">
                Visitas de hoy
              </h2>
              <p className="text-sm text-ink/70">Cuánta gente entró al sitio en el día, en hora de San Juan.</p>
            </div>
            <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { etiqueta: "Visitantes", valor: visitasHoy.totales.visitantes },
                { etiqueta: "Vistas de página", valor: visitasHoy.totales.vistas },
                { etiqueta: "En el sitio ahora", valor: activos.total },
              ].map((d) => (
                <div key={d.etiqueta}>
                  <dt className="text-xs font-semibold text-ink/60">{d.etiqueta}</dt>
                  <dd className="text-3xl font-bold tracking-tight">{new Intl.NumberFormat("es-AR").format(d.valor)}</dd>
                </div>
              ))}
            </dl>
            <Link href="/semiton/estadisticas" className={botonSecundario}>
              Ver estadísticas
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
        ) : null}

        <section className={`${tarjeta} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-lg font-bold">YouTube en vivo</h2>
            {live.live ? (
              <EnVivoInsignia />
            ) : (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink/60">
                Sin transmisión
              </span>
            )}
            <p className="text-sm text-ink/70">
              {MOTIVOS[live.motivo]}
              {live.titulo ? ` “${live.titulo}”` : ""}
            </p>
          </div>
          <Link href="/semiton/ajustes" className={botonSecundario}>
            Configurar
          </Link>
        </section>

        <section className={tarjeta} aria-labelledby="ultimas">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="ultimas" className="text-lg font-bold">
              Últimos cambios
            </h2>
            <Link href="/semiton/noticias" className="group flex items-center gap-1 text-sm font-semibold text-ink/70 hover:text-ink">
              Ver todas
              <ArrowRight className="size-4 transition-transform duration-700 ease-fluid group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          {ultimas.length > 0 ? (
            <ul className="divide-y divide-line">
              {ultimas.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/semiton/noticias/${n.id}`}
                    className="flex items-center gap-4 py-3 transition-colors duration-700 ease-fluid hover:text-hunter"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded bg-ink-1">
                      {n.imagen ? <Photo nombre={n.imagen} alt="" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold">{n.titulo}</p>
                      <p className="text-xs text-ink/60">
                        {n.publicada ? "Publicada" : "Borrador"} · {fechaBreve(n.actualizada)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Mensaje ok>Todavía no hay noticias. Cargá la primera con el botón Nueva noticia.</Mensaje>
          )}
        </section>
      </div>
    </>
  );
}
