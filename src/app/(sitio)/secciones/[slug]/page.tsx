import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SeccionPagina } from "@/components/site/SeccionPagina";
import { metaPagina } from "@/lib/seo";
import { SECCIONES, seccionPorSlug } from "@/lib/types";

export function generateStaticParams() {
  return SECCIONES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/secciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const seccion = seccionPorSlug(slug);
  if (!seccion) return { title: "No encontrado", robots: { index: false, follow: false } };
  return metaPagina({
    titulo: seccion.nombre,
    descripcion: seccion.bajada,
    ruta: `/secciones/${seccion.slug}`,
  });
}

async function Contenido({ params }: { params: PageProps<"/secciones/[slug]">["params"] }) {
  const { slug } = await params;
  const seccion = seccionPorSlug(slug);
  if (!seccion) notFound();
  return <SeccionPagina seccion={seccion} />;
}

export default function Pagina({ params }: PageProps<"/secciones/[slug]">) {
  // params se lee dentro de Suspense para que la navegación a la sección siga siendo instantánea.
  return (
    <Suspense fallback={null}>
      <Contenido params={params} />
    </Suspense>
  );
}
