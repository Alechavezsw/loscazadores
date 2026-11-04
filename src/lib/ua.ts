/**
 * Lee el User-Agent de quien visita: si es un robot y, si no, qué aparato, navegador y sistema usa.
 * No guarda el texto original: solo estas etiquetas. Sin dependencias, sirve en el servidor y en pruebas.
 */

export type Dispositivo = "Móvil" | "Tablet" | "Escritorio";

export type LecturaUA = {
  bot: boolean;
  dispositivo: Dispositivo;
  navegador: string;
  so: string;
};

const BOTS =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|facebot|whatsapp|telegram|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|java\/|go-http|okhttp|axios|node-fetch|undici|httpclient|libwww|scrapy|phantom|selenium|puppeteer|playwright|semrush|ahrefs|bytespider|petalbot|yandex|baidu|duckduckgo|ia_archiver|archive\.org/i;

export function analizarUA(ua: string): LecturaUA {
  const u = (ua || "").trim();
  if (!u) return { bot: true, dispositivo: "Escritorio", navegador: "Otro", so: "Otro" };
  const bot = BOTS.test(u);

  const tablet = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(u);
  const movil = /mobi|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(u);
  const dispositivo: Dispositivo = tablet ? "Tablet" : movil ? "Móvil" : "Escritorio";

  // Las aplicaciones que abren los enlaces por dentro van primero: mucha gente nos llega desde Instagram o Facebook.
  let navegador = "Otro";
  if (/instagram/i.test(u)) navegador = "Instagram (app)";
  else if (/fban|fbav|fb_iab|fbios/i.test(u)) navegador = "Facebook (app)";
  else if (/musical_ly|tiktok|bytedancewebview/i.test(u)) navegador = "TikTok (app)";
  else if (/edg\/|edge\/|edga\/|edgios\//i.test(u)) navegador = "Edge";
  else if (/opr\/|opera|opios\//i.test(u)) navegador = "Opera";
  else if (/samsungbrowser/i.test(u)) navegador = "Samsung Internet";
  else if (/firefox|fxios/i.test(u)) navegador = "Firefox";
  else if (/chrome|crios|chromium/i.test(u)) navegador = "Chrome";
  else if (/safari/i.test(u)) navegador = "Safari";

  let so = "Otro";
  if (/iphone|ipad|ipod/i.test(u)) so = "iOS";
  else if (/android/i.test(u)) so = "Android";
  else if (/windows/i.test(u)) so = "Windows";
  else if (/cros/i.test(u)) so = "ChromeOS";
  else if (/mac os x|macintosh/i.test(u)) so = "macOS";
  else if (/linux|x11/i.test(u)) so = "Linux";

  return { bot, dispositivo, navegador, so };
}
