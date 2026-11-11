/** Deja un texto listo para ir dentro de un XML (mapa del sitio, RSS): escapa los signos y saca los caracteres que XML no admite. */
export function xml(texto: string) {
  return texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Respuesta XML que los servidores intermedios pueden guardar unos minutos. */
export function respuestaXml(cuerpo: string, tipo = "application/xml") {
  return new Response(cuerpo, {
    headers: {
      "Content-Type": `${tipo}; charset=utf-8`,
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
