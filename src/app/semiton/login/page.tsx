import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Mensaje } from "@/components/admin/ui";
import { Logo } from "@/components/site/Brand";
import { esAdmin, panelConfigurado } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

async function Contenido() {
  if (await esAdmin()) redirect("/semiton");

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-1 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Panel de noticias</h1>
      <p className="mt-1 mb-6 text-sm text-white/60">Entrá con la contraseña del medio para cargar y editar contenido.</p>
      {panelConfigurado() ? (
        <div className="[&_label]:text-white [&_input]:border-white/20 [&_input]:bg-ink [&_input]:text-white [&_input]:focus:border-white">
          <LoginForm />
        </div>
      ) : (
        <Mensaje ok={false}>El panel todavía no tiene contraseña. Definí ADMIN_PASSWORD en el archivo .env.local y reiniciá el servidor.</Mensaje>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-4 py-16 text-white">
      <Logo className="w-56" />
      <Suspense fallback={<div aria-hidden className="h-64 w-full max-w-sm animate-pulse rounded-2xl bg-ink-1" />}>
        <Contenido />
      </Suspense>
      <Link href="/" className="text-sm font-semibold text-white/60 transition-colors duration-700 ease-fluid hover:text-white">
        Volver al sitio
      </Link>
    </main>
  );
}
