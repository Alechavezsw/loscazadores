import type { Metadata } from "next";
import { NewsBrowser } from "@/components/site/NewsBrowser";
import { PageHeader } from "@/components/site/PageHeader";
import { getNoticias } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Noticias",
  description: "Todas las noticias de tu barrio: lo último que publicamos en WhatsApp, Instagram, Facebook y YouTube.",
};

export default async function Noticias() {
  const noticias = await getNoticias();
  return (
    <>
      <PageHeader
        etiqueta="Archivo"
        titulo="Noticias"
        bajada="Todo lo que publicamos, ordenado de lo más nuevo a lo más viejo. Filtrá por tema o por red."
      />
      <NewsBrowser noticias={noticias} />
    </>
  );
}
