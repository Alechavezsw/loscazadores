import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
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

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: {
    default: "Los Cazadores de Noticias | Las noticias de tu barrio al instante",
    template: "%s | Los Cazadores de Noticias",
  },
  description:
    "Diario digital con las noticias de tu barrio al instante. Mirá lo último de nuestro canal de WhatsApp, Instagram y Facebook, y las transmisiones en vivo por YouTube.",
  applicationName: "Los Cazadores de Noticias",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Los Cazadores de Noticias",
    title: "Los Cazadores de Noticias",
    description: "Las noticias de tu barrio al instante.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Los Cazadores de Noticias" }],
  },
  twitter: { card: "summary_large_image" },
};

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
