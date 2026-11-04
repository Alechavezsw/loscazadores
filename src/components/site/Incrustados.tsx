import { cn } from "@/lib/cn";
import { incrustar, NOMBRE_PROVEEDOR, type Incrustado } from "@/lib/embeds";

/** Lo que se incrustó a mano: videos y publicaciones de otros sitios. `marco` cambia el borde que los rodea. */
export function Incrustados({
  urls,
  titulo,
  marco = "rounded-2xl border border-line bg-white",
}: {
  urls: string[];
  titulo: string;
  marco?: string;
}) {
  const lista = urls.map(incrustar).filter((e): e is Incrustado => e !== null);
  if (lista.length === 0) return null;

  return (
    <section aria-label="Videos y publicaciones incrustados" className="mt-10 flex flex-col gap-6">
      {lista.map((e) => {
        const caja = cn(
          "overflow-hidden",
          marco,
          e.forma === "vertical" && "mx-auto w-full max-w-[325px]",
          e.forma === "alto" && "mx-auto w-full max-w-[540px]",
        );
        const comun = {
          title: `${NOMBRE_PROVEEDOR[e.proveedor]}: ${titulo}`,
          src: e.src,
          loading: "lazy" as const,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
          allowFullScreen: true,
          referrerPolicy: "strict-origin-when-cross-origin" as const,
        };
        return (
          <div key={e.src} className={caja}>
            {e.forma === "video" ? (
              <div className="relative aspect-video">
                <iframe {...comun} className="absolute inset-0 size-full" />
              </div>
            ) : (
              <iframe {...comun} style={{ height: e.alto }} className="w-full" />
            )}
          </div>
        );
      })}
    </section>
  );
}
