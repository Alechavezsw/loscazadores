import type { Metadata } from "next";
import { EspacioPagina } from "@/components/site/EspacioPagina";
import { ESPACIO_INFO } from "@/lib/types";

export const metadata: Metadata = {
  title: `${ESPACIO_INFO["viva-feria"].nombre} – ${ESPACIO_INFO["viva-feria"].subtitulo}`,
  description: ESPACIO_INFO["viva-feria"].bajada,
};

export default function VivaFeria() {
  return <EspacioPagina espacio="viva-feria" />;
}
