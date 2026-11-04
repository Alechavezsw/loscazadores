import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Ajustes" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function Ajustes() {
  await requerirAdmin();
  const { ajustes } = await readDb();
  return (
    <>
      <TituloPagina titulo="Ajustes" bajada="Los enlaces de las redes, el canal de YouTube y los datos de contacto." />
      <SettingsForm ajustes={ajustes} />
    </>
  );
}
