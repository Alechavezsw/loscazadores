import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Reglas de uso del sitio y alcance del contenido que publicamos.",
};

export default function Terminos() {
  return (
    <LegalPage
      titulo="Términos"
      bajada="Las reglas básicas para usar este sitio y qué significa el contenido que ves en él."
      secciones={[
        {
          titulo: "Qué es este sitio",
          parrafos: [
            "Los Cazadores de Noticias es un medio de difusión de contenido enviado por la comunidad. Las opiniones y afirmaciones expresadas pertenecen a sus autores y no necesariamente reflejan la postura del medio.",
            "El sitio está destinado a personas mayores de 18 años.",
          ],
        },
        {
          titulo: "Sobre lo que publicamos",
          parrafos: [
            "Hacemos lo posible por revisar el material antes de publicarlo, pero no podemos garantizar que toda la información sea exacta o esté completa. Si encontrás un error, avisanos y lo corregimos.",
            "Las publicaciones de Instagram, Facebook, YouTube y WhatsApp que se muestran acá se rigen además por las condiciones de cada plataforma.",
          ],
        },
        {
          titulo: "Uso del contenido",
          parrafos: [
            "Los textos, el logo y el diseño del sitio pertenecen a Los Cazadores de Noticias. Podés compartir los enlaces a nuestras notas libremente. Para reproducir el contenido en otro medio, pedinos autorización.",
          ],
        },
        {
          titulo: "Publicidad",
          parrafos: [
            "Los espacios de promociones y publicidad son contenido pago de terceros. Los Cazadores de Noticias no se responsabiliza por los productos o servicios que allí se ofrecen.",
          ],
        },
      ]}
    />
  );
}
