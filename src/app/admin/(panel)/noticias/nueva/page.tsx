import type { Metadata } from "next";
import { NewsForm } from "@/components/admin/NewsForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { modoVideo } from "@/lib/videos";

export const metadata: Metadata = { title: "Nueva noticia" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function NuevaNoticia() {
  await requerirAdmin();
  return (
    <>
      <TituloPagina titulo="Nueva noticia" bajada="Cargá el texto, la foto y marcá en qué redes la publicaste." />
      <NewsForm modoVideo={modoVideo()} />
    </>
  );
}
