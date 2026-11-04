import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // La sección de videos se llamaba Sin censura y vivía en /sin-censura: las direcciones viejas siguen andando.
  async redirects() {
    return [
      { source: "/sin-censura", destination: "/videos", permanent: true },
      { source: "/sin-censura/:slug", destination: "/videos/:slug", permanent: true },
    ];
  },
  experimental: {
    // Las fotos de las noticias viajan dentro de la server action del panel.
    serverActions: { bodySizeLimit: "14mb" },
    // Sin la caché de compilación en disco del modo desarrollo: al reiniciar el servidor después de cambiar el
    // CSS, el logo u otros archivos, la caché vieja dejaba la página recargándose sola sin parar.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
