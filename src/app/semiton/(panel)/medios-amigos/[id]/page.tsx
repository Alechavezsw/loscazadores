import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MedioForm } from "@/components/admin/MedioForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Editar medio amigo" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function EditarMedio({ params }: PageProps<"/semiton/medios-amigos/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  const { mediosAmigos } = await readDb();
  const medio = mediosAmigos.find((m) => m.id === id);
  if (!medio) notFound();

  return (
    <>
      <TituloPagina titulo="Editar medio amigo" bajada={`${medio.nombre} · ${medio.tipo}`} />
      <MedioForm medio={medio} />
    </>
  );
}
