import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { urlSitio } from "@/lib/sitio";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Ajustes" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function Ajustes() {
  await requerirAdmin();
  const { ajustes } = await readDb();
  return (
    <>
      <TituloPagina titulo="Ajustes" bajada="Los enlaces de las redes, el canal de YouTube, los datos de contacto y la verificación de Google." />
      <SettingsForm ajustes={ajustes} sitio={urlSitio()} />
    </>
  );
}
