import Link from "next/link";
import { Logo } from "./Brand";

export function NotFound404() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-4 py-24 text-center text-white">
      <Logo className="w-64 md:w-96" />
      <div>
        <p className="font-mono text-sm uppercase tracking-widest text-hunter">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">Esta noticia se nos escapó</h1>
        <p className="mx-auto mt-4 max-w-md text-base text-white/70">
          La página que buscás no existe o ya no está publicada. Volvé al inicio y seguí cazando noticias.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-white px-8 py-3 text-base font-semibold text-ink transition-all duration-700 ease-fluid hover:bg-hunter hover:text-white active:scale-[0.98]"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
