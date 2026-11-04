import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdForm } from "@/components/admin/AdForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { SLOT_NOMBRE } from "@/lib/types";

export const metadata: Metadata = { title: "Editar anuncio" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function EditarAnuncio({ params }: PageProps<"/admin/publicidad/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  const { anuncios } = await readDb();
  const anuncio = anuncios.find((a) => a.id === id);
  if (!anuncio) notFound();

  return (
    <>
      <TituloPagina titulo="Editar anuncio" bajada={`${anuncio.titulo || "Sin nombre"} · ${SLOT_NOMBRE[anuncio.slot]}`} />
      <AdForm anuncio={anuncio} />
    </>
  );
}
