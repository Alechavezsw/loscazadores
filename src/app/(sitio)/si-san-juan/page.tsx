import type { Metadata } from "next";
import { EspacioPagina } from "@/components/site/EspacioPagina";
import { metaPagina } from "@/lib/seo";
import { ESPACIO_INFO } from "@/lib/types";

const espacio = ESPACIO_INFO["si-san-juan"];

export const metadata: Metadata = metaPagina({
  titulo: espacio.nombre,
  descripcion: espacio.bajada,
  ruta: espacio.ruta,
});

export default function SiSanJuan() {
  return <EspacioPagina espacio="si-san-juan" />;
}
