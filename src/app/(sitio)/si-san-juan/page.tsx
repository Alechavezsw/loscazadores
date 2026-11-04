import type { Metadata } from "next";
import { EspacioPagina } from "@/components/site/EspacioPagina";
import { ESPACIO_INFO } from "@/lib/types";

export const metadata: Metadata = {
  title: ESPACIO_INFO["si-san-juan"].nombre,
  description: ESPACIO_INFO["si-san-juan"].bajada,
};

export default function SiSanJuan() {
  return <EspacioPagina espacio="si-san-juan" />;
}
