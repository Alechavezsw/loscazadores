import type { Metadata } from "next";
import { VideoForm } from "@/components/admin/VideoForm";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { modoVideo } from "@/lib/videos";

export const metadata: Metadata = { title: "Nuevo video" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function NuevoVideo() {
  await requerirAdmin();
  return (
    <>
      <TituloPagina titulo="Nuevo video" bajada="Subí el archivo o pegá el enlace de YouTube, Facebook, Instagram, TikTok o Vimeo." />
      <VideoForm modoVideo={modoVideo()} />
    </>
  );
}
