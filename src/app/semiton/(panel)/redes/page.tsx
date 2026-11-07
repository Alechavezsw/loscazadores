import type { Metadata } from "next";
import { FeedsPanel } from "@/components/admin/FeedsPanel";
import { RedesPanel } from "@/components/admin/RedesPanel";
import { WebhookPanel } from "@/components/admin/WebhookPanel";
import { TituloPagina } from "@/components/admin/ui";
import { requerirAdmin } from "@/lib/auth";
import { fechaBreve } from "@/lib/format";
import { urlSitio } from "@/lib/sitio";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Redes" };

// Lee la sesión en cada pedido, así que no puede ser una navegación instantánea.
export const instant = false;

// Conectar, importar y probar feeds bajan fotos: en Vercel necesitan más que los 10 segundos de siempre.
export const maxDuration = 60;

function hostDe(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function Redes() {
  await requerirAdmin();
  const { meta, ajustes } = await readDb();
  const { conexion, estado, feeds, webhook } = meta;

  const sitio = urlSitio();
  const local = /^https?:\/\/(localhost|127\.|\[::1\]|0\.0\.0\.0)/i.test(sitio);

  // Al navegador solo llegan datos seguros: el token de la Página, la clave del aviso y las direcciones
  // completas de los feeds (que a veces llevan una clave) se quedan en el servidor.
  return (
    <>
      <TituloPagina
        titulo="Redes"
        bajada="Importá automáticamente lo que publicás en Instagram y Facebook. Elegí la forma que te resulte más cómoda."
      />
      <div className="flex flex-col gap-6">
        <WebhookPanel
          activo={Boolean(webhook.claveHash)}
          creada={webhook.creada ? fechaBreve(webhook.creada) : null}
          recibidos={webhook.recibidos}
          eventos={webhook.eventos.map((e) => ({ ...e, en: fechaBreve(e.en) }))}
          url={`${sitio}/api/importar`}
          local={local}
        />
        <FeedsPanel
          feeds={feeds.map((f) => ({
            id: f.id,
            nombre: f.nombre,
            host: hostDe(f.url),
            red: f.red,
            ultima: f.ultima ? fechaBreve(f.ultima) : null,
            nuevas: f.nuevas,
            fusionadas: f.fusionadas,
            error: f.error,
          }))}
        />
        <RedesPanel
          conexion={
            conexion
              ? { pageNombre: conexion.pageNombre, igUsuario: conexion.igUsuario, conectadaEn: fechaBreve(conexion.conectadaEn) }
              : null
          }
          estado={{
            ultima: estado.ultima ? fechaBreve(estado.ultima) : null,
            instagram: estado.instagram,
            facebook: estado.facebook,
            reconectar: estado.reconectar,
          }}
          ajustes={{
            sincronizar: ajustes.sincronizar,
            sincronizarPublicar: ajustes.sincronizarPublicar,
            sincronizarCategoria: ajustes.sincronizarCategoria,
            sincronizarCadaMin: ajustes.sincronizarCadaMin,
          }}
          appConfigurada={Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET)}
        />
      </div>
    </>
  );
}
