/**
 * De dónde llega la gente. Se decide con el sitio que la mandó (referrer) o con los parámetros utm de los
 * enlaces que se comparten. Solo se conserva el nombre del sitio, nunca la dirección completa.
 */

export type Fuente = { fuente: string; host: string };

const POR_UTM: Array<[RegExp, string]> = [
  [/^(fb|facebook|meta)/i, "Facebook"],
  [/^(ig|instagram)/i, "Instagram"],
  [/^(wa|whatsapp)/i, "WhatsApp"],
  [/^(yt|youtube)/i, "YouTube"],
  [/^google/i, "Google"],
  [/^(tw|twitter|x$)/i, "X (Twitter)"],
  [/^tiktok/i, "TikTok"],
  [/^(tg|telegram)/i, "Telegram"],
  [/^(mail|email|newsletter|correo)/i, "Correo"],
];

const POR_HOST: Array<[RegExp, string]> = [
  [/(^|\.)(facebook|fb)\.(com|me)$|(^|\.)fb\.watch$|^l\.facebook|^lm\.facebook/i, "Facebook"],
  [/(^|\.)instagram\.com$|^l\.instagram\.com$/i, "Instagram"],
  [/(^|\.)(whatsapp\.com|whatsapp\.net|wa\.me)$/i, "WhatsApp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "YouTube"],
  [/(^|\.)(google\.[a-z.]+|googleapis\.com|googlequicksearchbox)$|^android-app:\/\/com\.google\.android\.googlequicksearchbox/i, "Google"],
  [/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|yandex\.[a-z]+|search\.brave\.com)$/i, "Otros buscadores"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/i, "X (Twitter)"],
  [/(^|\.)tiktok\.com$/i, "TikTok"],
  [/(^|\.)(t\.me|telegram\.org)$/i, "Telegram"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/i, "LinkedIn"],
  [/(^|\.)reddit\.com$/i, "Reddit"],
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com)$/i, "Correo"],
];

const sinWww = (h: string) => h.toLowerCase().replace(/^(www|m)\./, "");

/**
 * `refHost` es el sitio del que viene (vacío si entró directo), `utmSource` lo que traiga el enlace y `propios`
 * los dominios de este mismo sitio. Devuelve null cuando es navegación interna, que no cuenta como fuente.
 */
export function clasificarFuente(refHost: string, utmSource: string, propios: string[]): Fuente | null {
  const host = sinWww((refHost || "").trim());
  const utm = (utmSource || "").trim().slice(0, 40);

  if (host && propios.some((p) => sinWww(p) === host)) return null;

  if (utm) {
    const hallada = POR_UTM.find(([re]) => re.test(utm));
    const nombre = hallada ? hallada[1] : utm.charAt(0).toUpperCase() + utm.slice(1).toLowerCase();
    return { fuente: nombre, host: host || "" };
  }
  if (!host) return { fuente: "Directo", host: "" };

  const hallada = POR_HOST.find(([re]) => re.test(host));
  return { fuente: hallada ? hallada[1] : "Otros sitios", host };
}
