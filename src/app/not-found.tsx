import type { Metadata } from "next";
import { NotFound404 } from "@/components/site/NotFound404";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false, follow: false } };

export default function NotFound() {
  return <NotFound404 />;
}
