import { PageHeader } from "./PageHeader";

export type Seccion = { titulo: string; parrafos: string[] };

export function LegalPage({ titulo, bajada, secciones }: { titulo: string; bajada: string; secciones: Seccion[] }) {
  return (
    <>
      <PageHeader etiqueta="Legales" titulo={titulo} bajada={bajada} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 md:py-16">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="text-2xl font-bold tracking-tight">{s.titulo}</h2>
            <div className="mt-3 flex flex-col gap-4 text-base leading-relaxed text-ink/80">
              {s.parrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        <p className="border-t border-line pt-6 text-sm text-ink/60">Última actualización: octubre de 2026.</p>
      </div>
    </>
  );
}
