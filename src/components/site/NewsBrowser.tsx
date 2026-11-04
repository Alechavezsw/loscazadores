"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlass, Newspaper } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { CANALES, type Canal, type Noticia } from "@/lib/types";
import { CANAL_UI } from "./canales";
import { NewsCard } from "./NewsCard";

const EASE = [0.32, 0.72, 0, 1] as const;

function sinTildes(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function NewsBrowser({ noticias }: { noticias: Noticia[] }) {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [canal, setCanal] = useState<Canal | null>(null);

  const categorias = useMemo(() => [...new Set(noticias.map((n) => n.categoria))].sort(), [noticias]);

  const visibles = useMemo(() => {
    const buscado = sinTildes(q.trim());
    return noticias.filter((n) => {
      if (categoria && n.categoria !== categoria) return false;
      if (canal && !n.canales.includes(canal)) return false;
      if (!buscado) return true;
      return sinTildes(`${n.titulo} ${n.cuerpo} ${n.zona} ${n.categoria}`).includes(buscado);
    });
  }, [noticias, q, categoria, canal]);

  const hayFiltros = Boolean(q || categoria || canal);

  const chip = (activo: boolean) =>
    cn(
      "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
      activo ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
    );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-6">
        <div className="relative max-w-xl">
          <label htmlFor="buscar" className="sr-only">
            Buscar noticias
          </label>
          <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/50" aria-hidden />
          <input
            id="buscar"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscá por tema, barrio o palabra"
            className="w-full rounded-full border border-line bg-white py-3 pl-12 pr-4 text-base outline-none transition-all duration-700 ease-fluid placeholder:text-ink/40 focus:border-ink"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tema">
          <button type="button" onClick={() => setCategoria(null)} aria-pressed={categoria === null} className={chip(categoria === null)}>
            Todas
          </button>
          {categorias.map((c) => (
            <button key={c} type="button" onClick={() => setCategoria(categoria === c ? null : c)} aria-pressed={categoria === c} className={chip(categoria === c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por red">
          {CANALES.map((c) => {
            const ui = CANAL_UI[c];
            return (
              <button key={c} type="button" onClick={() => setCanal(canal === c ? null : c)} aria-pressed={canal === c} className={chip(canal === c)}>
                <ui.Icono weight="fill" className="size-4" aria-hidden />
                {ui.corto}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="text-sm text-ink/60">
          {visibles.length === 1 ? "1 noticia" : `${visibles.length} noticias`}
          {hayFiltros ? " con estos filtros" : ""}
        </p>
      </div>

      {visibles.length > 0 ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibles.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="h-full"
              >
                <NewsCard n={n} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <Newspaper className="size-10 text-ink/30" aria-hidden />
          <p className="text-xl font-bold">No encontramos noticias con esos filtros</p>
          <p className="max-w-md text-base text-ink/70">Probá con otra palabra o sacá algún filtro para ver todo lo publicado.</p>
          {hayFiltros ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCategoria(null);
                setCanal(null);
              }}
              className="mt-2 rounded-full bg-ink px-6 py-2 text-base font-semibold text-white transition-all duration-700 ease-fluid hover:bg-hunter active:scale-[0.98]"
            >
              Borrar filtros
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
