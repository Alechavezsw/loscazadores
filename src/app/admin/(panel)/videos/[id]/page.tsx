import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { VideoForm } from "@/components/admin/VideoForm";
import { botonSecundario, TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { modoVideo } from "@/lib/videos";

export const metadata: Metadata = { title: "Editar video" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function EditarVideo({ params }: PageProps<"/admin/videos/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  const { sinCensura } = await readDb();
  const pieza = sinCensura.find((p) => p.id === id);
  if (!pieza) notFound();

  return (
    <>
      <TituloPagina titulo="Editar video" bajada={pieza.titulo}>
        {pieza.publicada && pieza.tipo === "video" ? (
          <Link href={`/videos/${pieza.slug}`} target="_blank" className={botonSecundario}>
            Ver en el sitio
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </TituloPagina>
      <VideoForm pieza={pieza} modoVideo={modoVideo()} />
    </>
  );
}
