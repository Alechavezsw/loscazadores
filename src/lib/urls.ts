/** Acepta "sitio.com/ruta" o "https://sitio.com/ruta" y devuelve una URL http(s) válida, o "" si no lo es. */
export function limpiarUrl(valor: string | null | undefined): string {
  const v = (valor ?? "").trim();
  if (!v) return "";
  const conProtocolo = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(conProtocolo);
    if (!u.hostname.includes(".")) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export function soloDigitos(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D+/g, "");
}

/** 5492645075475 → "264 507-5475" (celular argentino sin el 54 ni el 9). Otros formatos se muestran como +número. */
export function telefonoLegible(numero: string) {
  const n = soloDigitos(numero);
  if (/^549\d{10}$/.test(n)) {
    const local = n.slice(3);
    return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return n ? `+${n}` : "";
}

export function linkWhatsapp(numero: string, texto?: string) {
  const n = soloDigitos(numero);
  if (!n) return "";
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** "@usuario", "usuario" o la URL completa → URL del perfil. */
export function perfilInstagram(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || v.includes("instagram.com")) return limpiarUrl(v);
  return `https://www.instagram.com/${v.replace(/^@/, "")}/`;
}

export function handleInstagram(valor: string) {
  const v = valor.trim();
  if (!v) return "loscazadoresdenoticias";
  const m = v.match(/instagram\.com\/([\w.]+)/i);
  return (m ? m[1] : v.replace(/^@/, "")).replace(/\/$/, "");
}

/** "@canal", "UC…" o la URL → URL del canal de YouTube. */
export function perfilYoutube(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  if (/^UC[\w-]{22}$/.test(v)) return `https://www.youtube.com/channel/${v}`;
  if (/^https?:\/\//i.test(v) || v.includes("youtube.com")) return limpiarUrl(v);
  return `https://www.youtube.com/${v.startsWith("@") ? v : `@${v}`}`;
}

export function idVideoYoutube(valor: string): string | null {
  const v = valor.trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (u.hostname === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (!/(^|\.)youtube\.com$/.test(u.hostname)) return null;
    const porQuery = u.searchParams.get("v");
    if (porQuery && /^[\w-]{11}$/.test(porQuery)) return porQuery;
    const m = u.pathname.match(/^\/(?:live|embed|shorts|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Devuelve la URL del iframe oficial de Instagram para un post, reel o tv. */
export function embedInstagram(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/i);
  if (!m) return null;
  const tipo = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `https://www.instagram.com/${tipo}/${m[2]}/embed/captioned/`;
}

/** Devuelve la URL del plugin oficial de Facebook (post o video). */
export function embedFacebook(url: string): { src: string; alto: number } | null {
  if (!/(facebook\.com|fb\.watch)/i.test(url)) return null;
  const esVideo = /\/(videos|reel|watch)\b|fb\.watch/i.test(url);
  const href = encodeURIComponent(url);
  return esVideo
    ? { src: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=true&width=500`, alto: 520 }
    : { src: `https://www.facebook.com/plugins/post.php?href=${href}&show_text=true&width=500`, alto: 640 };
}

/** Para comparar dos enlaces a la misma publicación aunque cambien el www, los parámetros o la barra final. */
export function normalizarEnlace(valor: string | undefined): string {
  if (!valor) return "";
  try {
    const u = new URL(valor);
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}
