import Link from "next/link";
import { Suspense } from "react";
import { ArrowSquareOut, SignOut } from "@phosphor-icons/react/ssr";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/site/Brand";
import { requerirAdmin } from "@/lib/auth";
import { salir } from "../actions";

async function Estructura({ children }: { children: React.ReactNode }) {
  await requerirAdmin();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 bg-ink-1 p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:p-6">
        <div className="flex items-center justify-between gap-4 md:flex-col md:items-start md:gap-2">
          <Link href="/admin" aria-label="Panel, ir al resumen">
            <Logo className="w-32 md:w-40" />
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">Panel</p>
        </div>

        <AdminNav />

        <div className="mt-auto hidden flex-col gap-1 md:flex">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-white/70 transition-all duration-700 ease-fluid hover:bg-white/10 hover:text-white"
          >
            <ArrowSquareOut className="size-5" aria-hidden />
            Ver el sitio
          </Link>
          <form action={salir}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-white/70 transition-all duration-700 ease-fluid hover:bg-white/10 hover:text-white"
            >
              <SignOut className="size-5" aria-hidden />
              Salir
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-5xl">{children}</div>
        <div className="mx-auto mt-12 flex max-w-5xl items-center gap-4 border-t border-line pt-6 md:hidden">
          <Link href="/" target="_blank" className="text-sm font-semibold text-ink/70">
            Ver el sitio
          </Link>
          <form action={salir}>
            <button type="submit" className="text-sm font-semibold text-ink/70">
              Salir
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" role="status">
          <span className="sr-only">Cargando el panel</span>
          <div aria-hidden className="h-64 w-full max-w-5xl animate-pulse rounded-2xl bg-ink/10" />
        </div>
      }
    >
      <Estructura>{children}</Estructura>
    </Suspense>
  );
}
