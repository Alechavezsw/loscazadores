import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { getAjustes } from "@/lib/queries";
import { codigoGoogle, NOMBRE_SITIO, ROBOTS_ABIERTO, RUTA_RSS } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";

/**
 * La tipografía del logo es Avenir Next Cyr, que es de pago y no se puede publicar en la web sin su licencia.
 * Figtree es libre y es la que más se parece (mismas proporciones, la «a» de dos pisos, el mismo grosor que la
 * Avenir Medium del logo). Todo el sitio, incluido el panel, usa esta.
 */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const sitio = urlSitio();

/**
 * Lo que comparten todas las páginas. Cada página pública suma lo suyo con metaPagina (lib/seo).
 * La verificación de Google Search Console sale del panel (Ajustes → Google) o, si ahí está vacía, de la variable
 * GOOGLE_SITE_VERIFICATION. Va en todas las páginas porque Google la busca en la portada.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { googleVerificacion } = await getAjustes();
  const google = codigoGoogle(googleVerificacion) || codigoGoogle(process.env.GOOGLE_SITE_VERIFICATION);

  return {
    metadataBase: new URL(sitio),
    title: {
      default: `${NOMBRE_SITIO} | Las noticias de tu barrio al instante`,
      template: `%s | ${NOMBRE_SITIO}`,
    },
    description:
      "Diario digital de San Juan con las noticias de tu barrio al instante. Mirá lo último de nuestro canal de WhatsApp, Instagram y Facebook, y las transmisiones en vivo por YouTube.",
    applicationName: NOMBRE_SITIO,
    authors: [{ name: NOMBRE_SITIO, url: sitio }],
    creator: NOMBRE_SITIO,
    publisher: NOMBRE_SITIO,
    category: "news",
    // Los números de las notas no son teléfonos para marcar: sin esto el iPhone los vuelve enlaces.
    formatDetection: { telephone: false, address: false, email: false },
    robots: ROBOTS_ABIERTO,
    alternates: { types: { "application/rss+xml": [{ url: RUTA_RSS, title: NOMBRE_SITIO }] } },
    verification: google ? { google } : undefined,
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: NOMBRE_SITIO,
      title: NOMBRE_SITIO,
      description: "Las noticias de tu barrio al instante.",
      images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: NOMBRE_SITIO }],
    },
    twitter: {
      card: "summary_large_image",
      title: NOMBRE_SITIO,
      description: "Las noticias de tu barrio al instante.",
      images: ["/brand/og.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
