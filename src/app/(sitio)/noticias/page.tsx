import type { Metadata } from "next";
import { NewsBrowser } from "@/components/site/NewsBrowser";
import { PageHeader } from "@/components/site/PageHeader";
import { getNoticias } from "@/lib/queries";
import { JsonLd } from "@/components/site/JsonLd";
import { ldListado, ldMigas, metaPagina } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";

const DESCRIPCION = "Todas las noticias de tu barrio: lo último que publicamos en WhatsApp, Instagram, Facebook y YouTube.";

export const metadata: Metadata = metaPagina({
  titulo: "Noticias",
  descripcion: DESCRIPCION,
  ruta: "/noticias",
});

export default async function Noticias() {
  const noticias = await getNoticias();
  const sitio = urlSitio();
  return (
    <>
      <JsonLd
        datos={ldListado(sitio, {
          nombre: "Noticias",
          descripcion: DESCRIPCION,
          ruta: "/noticias",
          items: noticias.map((n) => ({ nombre: n.titulo, ruta: `/noticias/${n.slug}` })),
        })}
      />
      <JsonLd datos={ldMigas(sitio, [{ nombre: "Noticias", ruta: "/noticias" }])} />
      <PageHeader
        etiqueta="Archivo"
        titulo="Noticias"
        bajada="Todo lo que publicamos, ordenado de lo más nuevo a lo más viejo. Filtrá por tema o por red."
      />
      <NewsBrowser noticias={noticias} />
    </>
  );
}
