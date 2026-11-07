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
  experimental: {
    // Las fotos de las noticias viajan dentro de la server action del panel.
    serverActions: { bodySizeLimit: "14mb" },
    // Sin la caché de compilación en disco del modo desarrollo: al reiniciar el servidor después de cambiar el
    // CSS, el logo u otros archivos, la caché vieja dejaba la página recargándose sola sin parar.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
