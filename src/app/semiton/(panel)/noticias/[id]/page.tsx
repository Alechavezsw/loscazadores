import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { NewsForm } from "@/components/admin/NewsForm";
import { botonSecundario, TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { modoVideo } from "@/lib/videos";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Editar noticia" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

export default async function EditarNoticia({ params }: PageProps<"/semiton/noticias/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  const { noticias } = await readDb();
  const noticia = noticias.find((n) => n.id === id);
  if (!noticia) notFound();

  return (
    <>
      <TituloPagina titulo="Editar noticia" bajada={noticia.titulo}>
        {noticia.publicada ? (
          <Link href={`/noticias/${noticia.slug}`} target="_blank" className={botonSecundario}>
            Ver en el sitio
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </TituloPagina>
      <NewsForm noticia={noticia} modoVideo={modoVideo()} />
    </>
  );
}
