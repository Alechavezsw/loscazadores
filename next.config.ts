import type { NextConfig } from "next";

/**
 * Robots que reciben el título, la descripción, el enlace canónico y demás etiquetas dentro del <head> desde el
 * primer byte. Para el resto, Next las manda después (en el cuerpo) en las páginas que se arman en el momento, como
 * cada nota y cada video. La lista de Next no incluye a Googlebot porque confía en que ejecuta JavaScript; acá se lo
 * suma, junto con los buscadores con inteligencia artificial, para que lean las etiquetas sin depender de eso.
 * Al definir esta opción se reemplaza la lista de Next, así que va copiada entera (next/dist/shared/lib/router/utils/html-bots).
 */
const ROBOTS_SIN_ESPERA =
  /Googlebot|GoogleOther|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|PerplexityBot|Amazonbot|meta-externalagent|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot|Pinterest/i;

const nextConfig: NextConfig = {
  cacheComponents: true,
  htmlLimitedBots: ROBOTS_SIN_ESPERA,
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
