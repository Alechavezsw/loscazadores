import type { MetadataRoute } from "next";
import { NOMBRE_SITIO } from "@/lib/seo";

/** Los datos del sitio para cuando alguien lo agrega a la pantalla de inicio del teléfono, y el ícono que usa Google. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOMBRE_SITIO,
    short_name: "Los Cazadores",
    description: "Diario digital de San Juan con las noticias de tu barrio al instante.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["news"],
    icons: [
      { src: "/brand/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
