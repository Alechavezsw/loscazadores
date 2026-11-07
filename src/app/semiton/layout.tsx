import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  description: "Acceso privado.",
  robots: { index: false, follow: false },
  openGraph: { title: "Panel", description: "Acceso privado." },
  twitter: { card: "summary", title: "Panel", description: "Acceso privado." },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper">{children}</div>;
}
