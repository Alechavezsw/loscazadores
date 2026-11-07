import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = metaPagina({
  titulo: "Política de privacidad",
  descripcion: "Qué datos usa este sitio y cómo se cuidan.",
  ruta: "/privacidad",
});

export default function Privacidad() {
  return (
    <LegalPage
      titulo="Privacidad"
      bajada="Qué datos usa este sitio, para qué y cómo podés pedir que los borremos."
      secciones={[
        {
          titulo: "Qué datos recibimos",
          parrafos: [
            "Podés leer todo el sitio sin darnos ningún dato. No hay registro de usuarios ni formularios de contacto: para mandarnos una noticia o consultar por publicidad te llevamos a WhatsApp.",
            "Como cualquier sitio, nuestro servidor registra datos técnicos de cada visita, como la dirección IP, el navegador y la fecha. Los usamos solo para mantener el sitio funcionando y detectar abusos.",
          ],
        },
        {
          titulo: "Estadísticas de uso",
          parrafos: [
            "Para saber cuánta gente lee el sitio y qué le interesa, contamos las visitas, las páginas más vistas, el tiempo de lectura y los clics en botones y anuncios. No usamos cookies para esto y no guardamos tu dirección IP en las estadísticas: con tu IP y tu navegador se arma un código anónimo que cambia todos los días y del que solo se anotan contadores, así que no se puede seguir a una persona de un día para otro ni identificarla.",
            "Si usás un bloqueador de rastreadores, es posible que tu visita no se cuente.",
          ],
        },
        {
          titulo: "Contenido de terceros",
          parrafos: [
            "Algunas páginas muestran videos de YouTube y publicaciones de Instagram o Facebook. Esas empresas pueden instalar cookies y recibir datos de tu navegador cuando el contenido se carga. Para YouTube usamos el modo de privacidad ampliada, que no instala cookies hasta que reproducís el video.",
            "Te recomendamos leer las políticas de privacidad de YouTube, Instagram y Facebook para saber cómo tratan esa información.",
          ],
        },
        {
          titulo: "Contenido enviado por la comunidad",
          parrafos: [
            "Si nos mandás fotos, videos o textos por WhatsApp, los usamos solo para evaluar si los publicamos. Si aparecés en algo que subimos y querés que lo retiremos, escribinos al mismo número y lo sacamos.",
          ],
        },
        {
          titulo: "Tus derechos",
          parrafos: [
            "Conforme a la Ley 25.326 de Protección de los Datos Personales, podés pedirnos acceso, corrección o supresión de los datos que tengamos sobre vos. La Agencia de Acceso a la Información Pública es el órgano de control de esta ley.",
          ],
        },
      ]}
    />
  );
}
