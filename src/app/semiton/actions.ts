"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cerrarSesion, intentarLogin, requerirAdmin } from "@/lib/auth";
import { leerIncrustados, MAX_INCRUSTADOS } from "@/lib/embeds";
import { borrarImagen, ErrorImagen, guardarImagen } from "@/lib/images";
import { borrarVideo, videoValido } from "@/lib/videos";
import { getLiveStatus, urlLiveDelCanal } from "@/lib/live";
import { ErrorFeed, leerFeed } from "@/lib/feeds";
import { conectar, ErrorMeta, verificar } from "@/lib/meta";
import { mutateDb, newId, readDb, slugify } from "@/lib/store";
import { sincronizar, sincronizarFeed } from "@/lib/sync";
import { huella, nuevaClave } from "@/lib/webhook";
import {
  CANALES,
  CATEGORIAS,
  SLOTS,
  esEspacio,
  type Ajustes,
  type Anuncio,
  type LiveStatus,
  type Noticia,
  type YoutubeModo,
} from "@/lib/types";
import { idVideoYoutube, limpiarUrl, soloDigitos } from "@/lib/urls";

export type FormState = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  /** Valor que se muestra una sola vez, por ejemplo la clave recién generada. */
  clave?: string;
};

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const marcado = (fd: FormData, campo: string) => fd.get(campo) === "on";
const archivo = (fd: FormData, campo: string) => {
  const f = fd.get(campo);
  return f instanceof File && f.size > 0 ? f : null;
};

/** Renueva lo que ve el público y lo que muestra el propio panel. */
function refrescar() {
  updateTag("contenido");
  revalidatePath("/semiton", "layout");
}

/**
 * Lee del formulario el video ya subido y los enlaces a incrustar, y anota en `errores` lo que no sirva.
 * El video se subió antes de enviar el formulario: acá llega solo su dirección (o su nombre de archivo).
 */
function leerMedios(fd: FormData, errores: Record<string, string>) {
  const videoCrudo = texto(fd, "video");
  const video = marcado(fd, "quitar_video") ? null : videoCrudo || null;
  if (video && !videoValido(video)) errores.video = "El video no es válido. Subilo de nuevo.";

  const lectura = leerIncrustados(String(fd.get("incrustados") ?? ""));
  if (lectura.errores.length > 0) {
    errores.incrustados = `No se pudo incrustar: ${lectura.errores.map((e) => `línea ${e.linea} (${e.texto})`).join(", ")}. Sirven YouTube, Vimeo, TikTok, Facebook e Instagram.`;
  } else if (lectura.validos.length > MAX_INCRUSTADOS) {
    errores.incrustados = `Se pueden incrustar hasta ${MAX_INCRUSTADOS} enlaces por nota.`;
  }
  return { video, incrustados: lectura.validos.map((v) => v.url) };
}

// ───────────────────────── sesión ─────────────────────────

export async function iniciarSesion(_prev: FormState, fd: FormData): Promise<FormState> {
  const resultado = await intentarLogin(String(fd.get("password") ?? ""));
  if (resultado === "ok") redirect("/semiton");
  const mensajes = {
    mal: "La contraseña no es correcta.",
    bloqueado: "Hubo demasiados intentos fallidos. Esperá 10 minutos y probá de nuevo.",
    "sin-config": "El panel todavía no tiene contraseña. Definí ADMIN_PASSWORD en el archivo .env.local.",
  } as const;
  return { ok: false, mensaje: mensajes[resultado] };
}

export async function salir() {
  await cerrarSesion();
  redirect("/semiton/login");
}

// ───────────────────────── noticias ─────────────────────────

export async function guardarNoticia(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();

  const id = texto(fd, "id");
  const titulo = texto(fd, "titulo");
  const cuerpo = texto(fd, "cuerpo");
  const categoria = texto(fd, "categoria");
  const zona = texto(fd, "zona").slice(0, 60);
  const espacioCrudo = texto(fd, "espacio");
  const errores: Record<string, string> = {};

  if (titulo.length < 5) errores.titulo = "Escribí un título de al menos 5 caracteres.";
  if (titulo.length > 160) errores.titulo = "El título no puede pasar de 160 caracteres.";
  if (espacioCrudo && !esEspacio(espacioCrudo)) errores.espacio = "Elegí un espacio de la lista.";
  if (cuerpo.length < 10) errores.cuerpo = "Escribí el texto de la noticia.";
  if (cuerpo.length > 8000) errores.cuerpo = "El texto no puede pasar de 8000 caracteres.";
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) errores.categoria = "Elegí una categoría.";

  const canales = CANALES.filter((c) => marcado(fd, `canal_${c}`));
  const enlaces: Noticia["enlaces"] = {};
  for (const c of CANALES) {
    const crudo = texto(fd, `enlace_${c}`);
    if (!crudo) continue;
    const url = limpiarUrl(crudo);
    if (url) enlaces[c] = url;
    else errores[`enlace_${c}`] = "Ese enlace no es válido. Pegá la dirección completa de la publicación.";
  }

  const { video, incrustados } = leerMedios(fd, errores);

  const nueva = archivo(fd, "imagen");
  let imagenNueva: string | null = null;
  if (nueva && !errores.imagen) {
    try {
      imagenNueva = await guardarImagen(nueva);
    } catch (e) {
      errores.imagen = e instanceof ErrorImagen ? e.message : "No pudimos guardar la imagen.";
    }
  }

  if (Object.keys(errores).length > 0) {
    await borrarImagen(imagenNueva);
    return { ok: false, mensaje: "Revisá los campos marcados.", errores };
  }

  const ahora = new Date().toISOString();
  const quitar = marcado(fd, "quitar_imagen");
  let imagenAnterior: string | null = null;
  let videoAnterior: string | null = null;

  const resultado = await mutateDb((db) => {
    const campos = {
      titulo,
      cuerpo,
      categoria,
      zona,
      canales,
      enlaces,
      video: video ?? undefined,
      incrustados: incrustados.length > 0 ? incrustados : undefined,
      urgente: marcado(fd, "urgente"),
      destacada: marcado(fd, "destacada"),
      espacio: esEspacio(espacioCrudo) ? espacioCrudo : undefined,
      publicada: texto(fd, "estado") !== "borrador",
      actualizada: ahora,
    };

    const existente = id ? db.noticias.find((n) => n.id === id) : undefined;
    if (existente) {
      imagenAnterior = existente.imagen;
      videoAnterior = existente.video ?? null;
      const imagen = imagenNueva ?? (quitar ? null : existente.imagen);
      // Una noticia de muestra deja de serlo apenas la editás.
      Object.assign(existente, campos, { imagen, ejemplo: false });
      if (campos.destacada) for (const n of db.noticias) if (n.id !== existente.id) n.destacada = false;
      return "actualizada" as const;
    }

    const nuevoId = newId();
    db.noticias.push({
      ...campos,
      id: nuevoId,
      slug: `${slugify(titulo) || "noticia"}-${nuevoId}`,
      imagen: imagenNueva,
      ejemplo: false,
      creada: ahora,
    });
    if (campos.destacada) for (const n of db.noticias) if (n.id !== nuevoId) n.destacada = false;
    return "creada" as const;
  });

  if (imagenAnterior && imagenAnterior !== (imagenNueva ?? (quitar ? null : imagenAnterior))) {
    await borrarImagen(imagenAnterior);
  }
  // Si se cambió o se quitó el video, el anterior ya no lo usa nadie.
  if (videoAnterior && videoAnterior !== video) await borrarVideo(videoAnterior);

  refrescar();
  redirect(`/semiton/noticias?msg=${resultado === "creada" ? "creada" : "guardada"}`);
}

export async function eliminarNoticia(id: string) {
  await requerirAdmin();
  const quitada = await mutateDb((db) => {
    const i = db.noticias.findIndex((n) => n.id === id);
    if (i < 0) return null;
    return db.noticias.splice(i, 1)[0];
  });
  await borrarImagen(quitada?.imagen);
  await borrarVideo(quitada?.video);
  refrescar();
  redirect("/semiton/noticias?msg=eliminada");
}

/**
 * Cuando en el formulario se reemplaza o se quita un video que recién se había subido y todavía no se guardó
 * con ninguna noticia, se borra para no dejarlo ocupando lugar.
 */
export async function descartarVideoSubido(valor: string) {
  await requerirAdmin();
  if (!videoValido(valor)) return;
  const { noticias, sinCensura } = await readDb();
  if (noticias.some((n) => n.video === valor) || sinCensura.some((p) => p.video === valor)) return;
  await borrarVideo(valor);
}

export async function alternarPublicada(id: string) {
  await requerirAdmin();
  await mutateDb((db) => {
    const n = db.noticias.find((x) => x.id === id);
    if (n) {
      n.publicada = !n.publicada;
      n.actualizada = new Date().toISOString();
    }
  });
  refrescar();
}

export async function borrarEjemplos() {
  await requerirAdmin();
  const fuera = await mutateDb((db) => {
    const sobran = [...db.noticias.filter((n) => n.ejemplo), ...db.sinCensura.filter((p) => p.ejemplo)];
    db.noticias = db.noticias.filter((n) => !n.ejemplo);
    db.sinCensura = db.sinCensura.filter((p) => !p.ejemplo);
    return sobran;
  });
  await Promise.all(fuera.flatMap((x) => [borrarImagen(x.imagen), borrarVideo(x.video)]));
  refrescar();
  redirect("/semiton/noticias?msg=ejemplos");
}

// ───────────────────────── videos ─────────────────────────

/** La sección de videos (hoy «Sin censura»): solo admite videos, subidos o incrustados. */
export async function guardarPieza(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();

  const id = texto(fd, "id");
  const titulo = texto(fd, "titulo");
  const cuerpo = texto(fd, "cuerpo");
  const errores: Record<string, string> = {};

  if (titulo.length < 5) errores.titulo = "Escribí un título de al menos 5 caracteres.";
  if (titulo.length > 160) errores.titulo = "El título no puede pasar de 160 caracteres.";
  if (cuerpo.length > 8000) errores.cuerpo = "El texto no puede pasar de 8000 caracteres.";

  const { video, incrustados } = leerMedios(fd, errores);
  if (!video && incrustados.length === 0 && !errores.video && !errores.incrustados) {
    errores.video = "Un video necesita el archivo subido o un enlace para incrustar.";
  }

  const nueva = archivo(fd, "imagen");
  let imagenNueva: string | null = null;
  if (nueva && !errores.imagen) {
    try {
      imagenNueva = await guardarImagen(nueva);
    } catch (e) {
      errores.imagen = e instanceof ErrorImagen ? e.message : "No pudimos guardar la imagen.";
    }
  }

  if (Object.keys(errores).length > 0) {
    await borrarImagen(imagenNueva);
    return { ok: false, mensaje: "Revisá los campos marcados.", errores };
  }

  const ahora = new Date().toISOString();
  const quitar = marcado(fd, "quitar_imagen");
  let imagenAnterior: string | null = null;
  let videoAnterior: string | null = null;

  const resultado = await mutateDb((db) => {
    const campos = {
      tipo: "video" as const,
      titulo,
      cuerpo,
      video: video ?? undefined,
      incrustados: incrustados.length > 0 ? incrustados : undefined,
      destacada: marcado(fd, "destacada"),
      publicada: texto(fd, "estado") !== "borrador",
      actualizada: ahora,
    };

    const existente = id ? db.sinCensura.find((p) => p.id === id) : undefined;
    if (existente) {
      imagenAnterior = existente.imagen;
      videoAnterior = existente.video ?? null;
      const imagen = imagenNueva ?? (quitar ? null : existente.imagen);
      // Un video de muestra deja de serlo apenas lo editás.
      Object.assign(existente, campos, { imagen, ejemplo: false });
      if (campos.destacada) for (const p of db.sinCensura) if (p.id !== existente.id) p.destacada = false;
      return "actualizada" as const;
    }

    const nuevoId = newId();
    db.sinCensura.push({
      ...campos,
      id: nuevoId,
      slug: `${slugify(titulo) || "pieza"}-${nuevoId}`,
      imagen: imagenNueva,
      ejemplo: false,
      creada: ahora,
    });
    if (campos.destacada) for (const p of db.sinCensura) if (p.id !== nuevoId) p.destacada = false;
    return "creada" as const;
  });

  if (imagenAnterior && imagenAnterior !== (imagenNueva ?? (quitar ? null : imagenAnterior))) {
    await borrarImagen(imagenAnterior);
  }
  if (videoAnterior && videoAnterior !== video) await borrarVideo(videoAnterior);

  refrescar();
  redirect(`/semiton/videos?msg=${resultado === "creada" ? "creada" : "guardada"}`);
}

export async function eliminarPieza(id: string) {
  await requerirAdmin();
  const quitada = await mutateDb((db) => {
    const i = db.sinCensura.findIndex((p) => p.id === id);
    if (i < 0) return null;
    return db.sinCensura.splice(i, 1)[0];
  });
  await borrarImagen(quitada?.imagen);
  await borrarVideo(quitada?.video);
  refrescar();
  redirect("/semiton/videos?msg=eliminada");
}

export async function alternarPieza(id: string) {
  await requerirAdmin();
  await mutateDb((db) => {
    const p = db.sinCensura.find((x) => x.id === id);
    if (p) {
      p.publicada = !p.publicada;
      p.actualizada = new Date().toISOString();
    }
  });
  refrescar();
}

// ───────────────────────── publicidad ─────────────────────────

export async function guardarAnuncio(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();

  // Con `id` se edita un anuncio que ya existe; sin `id` se crea uno nuevo.
  const id = texto(fd, "id");
  const slot = texto(fd, "slot");
  const titulo = texto(fd, "titulo").slice(0, 80);
  const crudo = texto(fd, "enlace");
  const enlace = crudo ? limpiarUrl(crudo) : "";
  const imagen = archivo(fd, "imagen");
  const errores: Record<string, string> = {};

  const existente = id ? (await readDb()).anuncios.find((a) => a.id === id) : undefined;
  if (id && !existente) return { ok: false, mensaje: "Ese anuncio ya no existe. Volvé a la lista de publicidad." };

  if (!(SLOTS as readonly string[]).includes(slot)) errores.slot = "Elegí dónde se va a mostrar.";
  if (crudo && !enlace) errores.enlace = "Ese enlace no es válido. Pegá la dirección completa.";
  // Al editar, si no se elige una imagen nueva se queda la que ya tenía.
  if (!imagen && !existente?.imagen) errores.imagen = "Subí la imagen del anuncio.";
  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revisá los campos marcados.", errores };

  let nombre: string | null = null;
  if (imagen) {
    try {
      nombre = await guardarImagen(imagen);
    } catch (e) {
      return {
        ok: false,
        mensaje: "Revisá los campos marcados.",
        errores: { imagen: e instanceof ErrorImagen ? e.message : "No pudimos guardar la imagen." },
      };
    }
  }

  if (!existente) {
    const anuncio: Anuncio = {
      id: newId(),
      slot: slot as Anuncio["slot"],
      titulo,
      imagen: nombre,
      enlace,
      activo: marcado(fd, "activo"),
      creada: new Date().toISOString(),
    };
    await mutateDb((db) => {
      db.anuncios.push(anuncio);
    });
    refrescar();
    return { ok: true, mensaje: "Anuncio guardado." };
  }

  let imagenAnterior: string | null = null;
  const encontrado = await mutateDb((db) => {
    const a = db.anuncios.find((x) => x.id === existente.id);
    if (!a) return false;
    imagenAnterior = a.imagen;
    a.slot = slot as Anuncio["slot"];
    a.titulo = titulo;
    a.enlace = enlace;
    a.activo = marcado(fd, "activo");
    if (nombre) a.imagen = nombre;
    return true;
  });

  if (!encontrado) {
    // Se borró mientras se editaba: la imagen recién subida no la usa nadie.
    await borrarImagen(nombre);
    return { ok: false, mensaje: "Ese anuncio se borró mientras lo editabas." };
  }
  // La imagen anterior ya no la usa nadie cuando se la reemplazó por otra.
  if (nombre && imagenAnterior) await borrarImagen(imagenAnterior);

  refrescar();
  redirect("/semiton/publicidad?msg=guardado");
}

export async function alternarAnuncio(id: string) {
  await requerirAdmin();
  await mutateDb((db) => {
    const a = db.anuncios.find((x) => x.id === id);
    if (a) a.activo = !a.activo;
  });
  refrescar();
}

export async function eliminarAnuncio(id: string) {
  await requerirAdmin();
  const imagen = await mutateDb((db) => {
    const i = db.anuncios.findIndex((a) => a.id === id);
    if (i < 0) return null;
    return db.anuncios.splice(i, 1)[0].imagen;
  });
  await borrarImagen(imagen);
  refrescar();
}

// ───────────────────────── ajustes ─────────────────────────

const MODOS: YoutubeModo[] = ["auto", "manual", "off"];

type AjustesSitio = Pick<
  Ajustes,
  | "lema"
  | "aviso"
  | "whatsappCanal"
  | "instagram"
  | "facebook"
  | "youtube"
  | "youtubeModo"
  | "youtubeVideoManual"
  | "whatsappContacto"
  | "nombreVideos"
  | "declaracion"
  | "historiaTitulo"
  | "historiaTexto"
  | "tomateve"
  | "radioEnlace"
>;

function leerAjustes(fd: FormData) {
  return {
    lema: texto(fd, "lema"),
    aviso: texto(fd, "aviso"),
    whatsappCanal: texto(fd, "whatsappCanal"),
    instagram: texto(fd, "instagram"),
    facebook: texto(fd, "facebook"),
    youtube: texto(fd, "youtube"),
    youtubeModo: texto(fd, "youtubeModo") as YoutubeModo,
    youtubeVideoManual: texto(fd, "youtubeVideoManual"),
    whatsappContacto: soloDigitos(texto(fd, "whatsappContacto")),
    nombreVideos: texto(fd, "nombreVideos"),
    declaracion: texto(fd, "declaracion"),
    historiaTitulo: texto(fd, "historiaTitulo"),
    historiaTexto: texto(fd, "historiaTexto"),
    tomateve: texto(fd, "tomateve"),
    radioEnlace: texto(fd, "radioEnlace"),
  } satisfies AjustesSitio;
}

export async function guardarAjustes(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();
  const a = leerAjustes(fd);
  const errores: Record<string, string> = {};

  if (a.lema.length < 3) errores.lema = "Escribí el lema del sitio.";
  if (a.aviso.length < 10) errores.aviso = "Escribí el aviso legal que va en la portada y el pie.";
  if (a.whatsappCanal && !limpiarUrl(a.whatsappCanal)) errores.whatsappCanal = "Pegá el enlace completo del canal de WhatsApp.";
  if (a.facebook && !limpiarUrl(a.facebook)) errores.facebook = "Pegá el enlace completo de la página de Facebook.";
  if (a.instagram && !/^(@?[\w.]+|https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?.*)$/i.test(a.instagram)) {
    errores.instagram = "Escribí el usuario (por ejemplo @loscazadoresdenoticias) o el enlace del perfil.";
  }
  if (a.youtube && !urlLiveDelCanal(a.youtube)) {
    errores.youtube = "Escribí el @usuario del canal, su ID que empieza con UC o el enlace del canal.";
  }
  if (!MODOS.includes(a.youtubeModo)) errores.youtubeModo = "Elegí cómo se detecta la transmisión.";
  if (a.youtubeModo === "manual" && !idVideoYoutube(a.youtubeVideoManual)) {
    errores.youtubeVideoManual = "Pegá el enlace o el ID del video que está en vivo.";
  }
  if (a.whatsappContacto && (a.whatsappContacto.length < 10 || a.whatsappContacto.length > 15)) {
    errores.whatsappContacto = "Escribí el número con código de país, por ejemplo 5492645075475.";
  }
  if (a.nombreVideos.length < 3 || a.nombreVideos.length > 30) errores.nombreVideos = "Escribí el nombre de la sección, de 3 a 30 letras.";
  if (a.declaracion.length < 20 || a.declaracion.length > 600) errores.declaracion = "Escribí la frase, de 20 a 600 caracteres.";
  if (a.historiaTitulo.length < 3 || a.historiaTitulo.length > 60) errores.historiaTitulo = "Escribí el título, de 3 a 60 caracteres.";
  if (a.historiaTexto.length < 10 || a.historiaTexto.length > 200) errores.historiaTexto = "Escribí el texto, de 10 a 200 caracteres.";
  if (a.tomateve && !urlLiveDelCanal(a.tomateve)) {
    errores.tomateve = "Escribí el @usuario del canal de TomateTV, su ID que empieza con UC o el enlace del canal.";
  }
  if (a.radioEnlace && !limpiarUrl(a.radioEnlace)) errores.radioEnlace = "Pegá el enlace completo para escuchar la radio.";

  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revisá los campos marcados.", errores };

  await mutateDb((db) => {
    // Se conservan los ajustes de sincronización, que se editan en la pantalla Redes.
    db.ajustes = { ...db.ajustes, ...a };
  });
  refrescar();
  return { ok: true, mensaje: "Ajustes guardados." };
}

export type PruebaLive = { estado: LiveStatus } | null;

/** Consulta a YouTube con lo que hay escrito en el formulario, sin guardar nada. */
export async function probarEnVivo(_prev: PruebaLive, fd: FormData): Promise<PruebaLive> {
  await requerirAdmin();
  const a = leerAjustes(fd);
  // canal=tomateve prueba el canal de TOMATEVE en lugar del propio.
  const ajustes =
    texto(fd, "canal") === "tomateve" ? { youtube: a.tomateve, youtubeModo: "auto" as const, youtubeVideoManual: "" } : a;
  return { estado: await getLiveStatus(ajustes, { forzar: true }) };
}

// ───────────────────────── sincronización con Meta ─────────────────────────

function mensajeDe(e: unknown) {
  return e instanceof ErrorMeta ? e.message : "Ocurrió un error inesperado. Probá de nuevo en un rato.";
}

function resumenSync(r: Awaited<ReturnType<typeof sincronizar>>): FormState {
  const errores = [
    r.instagram?.error ? `Instagram: ${r.instagram.error}` : null,
    r.facebook?.error ? `Facebook: ${r.facebook.error}` : null,
  ].filter(Boolean);

  const partes = [
    r.nuevas === 0 ? "No hay publicaciones nuevas" : r.nuevas === 1 ? "Se importó 1 publicación nueva" : `Se importaron ${r.nuevas} publicaciones nuevas`,
    r.fusionadas > 0 ? `${r.fusionadas} ya estaban cargadas desde la otra red y se unieron` : null,
  ].filter(Boolean);

  return errores.length > 0
    ? { ok: false, mensaje: `${partes.join(". ")}. ${errores.join(" ")}` }
    : { ok: true, mensaje: `${partes.join(". ")}.` };
}

export async function conectarMeta(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();
  const token = texto(fd, "token");
  if (token.length < 20) {
    return { ok: false, mensaje: "Revisá los campos marcados.", errores: { token: "Pegá el token completo que generaste en Meta." } };
  }

  let conexion;
  try {
    conexion = await conectar(token, texto(fd, "pagina"));
  } catch (e) {
    return { ok: false, mensaje: mensajeDe(e) };
  }

  await mutateDb((db) => {
    db.meta.conexion = conexion;
    db.meta.estado = { ultima: null };
  });

  // Se hace una primera importación enseguida para que se vea el resultado.
  let importacion = "";
  try {
    const r = await sincronizar();
    importacion = ` ${resumenSync(r).mensaje}`;
  } catch (e) {
    importacion = ` La primera importación falló: ${mensajeDe(e)}`;
  }

  refrescar();
  const instagram = conexion.igUsuario ? ` e Instagram @${conexion.igUsuario}` : ". Esa Página no tiene una cuenta de Instagram profesional vinculada, así que solo se importa Facebook";
  return { ok: true, mensaje: `Conectado a la Página ${conexion.pageNombre}${instagram}.${importacion}` };
}

export async function desconectarMeta() {
  await requerirAdmin();
  await mutateDb((db) => {
    db.meta.conexion = null;
    db.meta.estado = { ultima: null };
  });
  refrescar();
}

export async function sincronizarAhora(): Promise<FormState> {
  await requerirAdmin();
  try {
    const resultado = await sincronizar();
    refrescar();
    return resumenSync(resultado);
  } catch (e) {
    return { ok: false, mensaje: mensajeDe(e) };
  }
}

export async function probarMeta(): Promise<FormState> {
  await requerirAdmin();
  const { meta } = await readDb();
  if (!meta.conexion) return { ok: false, mensaje: "Todavía no hay una cuenta de Meta conectada." };
  try {
    const r = await verificar(meta.conexion);
    return {
      ok: true,
      mensaje: `La conexión funciona. Página ${r.pagina}${r.instagram ? ` e Instagram @${r.instagram}` : ", sin Instagram vinculado"}.`,
    };
  } catch (e) {
    return { ok: false, mensaje: mensajeDe(e) };
  }
}

const INTERVALOS = [5, 10, 15, 30, 60];

export async function guardarSync(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();
  const categoria = texto(fd, "sincronizarCategoria");
  const cada = Number(texto(fd, "sincronizarCadaMin"));
  const errores: Record<string, string> = {};
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) errores.sincronizarCategoria = "Elegí una categoría.";
  if (!INTERVALOS.includes(cada)) errores.sincronizarCadaMin = "Elegí cada cuánto se revisa.";
  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revisá los campos marcados.", errores };

  await mutateDb((db) => {
    db.ajustes.sincronizar = marcado(fd, "sincronizar");
    db.ajustes.sincronizarPublicar = texto(fd, "sincronizarPublicar") !== "borrador";
    db.ajustes.sincronizarCategoria = categoria;
    db.ajustes.sincronizarCadaMin = cada;
  });
  refrescar();
  return { ok: true, mensaje: "Preferencias guardadas." };
}

// ───────────────────────── feeds y avisos (Make, Zapier, Behold…) ─────────────────────────

const MAX_FEEDS = 10;

function resumenFeed(r: Awaited<ReturnType<typeof sincronizarFeed>>): FormState {
  if (r.error) return { ok: false, mensaje: r.error };
  const unidas = r.fusionadas > 0 ? ` y se unieron ${r.fusionadas} que ya estaban de la otra red` : "";
  return {
    ok: true,
    mensaje: r.nuevas === 0 ? `No hay publicaciones nuevas${unidas}.` : `Se importaron ${r.nuevas} ${r.nuevas === 1 ? "publicación" : "publicaciones"}${unidas}.`,
  };
}

export async function agregarFeed(_prev: FormState, fd: FormData): Promise<FormState> {
  await requerirAdmin();
  const crudo = texto(fd, "url");
  const url = limpiarUrl(crudo);
  const red = texto(fd, "red") === "facebook" ? "facebook" : "instagram";
  const nombre = texto(fd, "nombre").slice(0, 60);
  const errores: Record<string, string> = {};

  if (!url) errores.url = "Pegá el enlace completo del feed.";
  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revisá los campos marcados.", errores };

  const { meta } = await readDb();
  if (meta.feeds.length >= MAX_FEEDS) return { ok: false, mensaje: `Ya cargaste ${MAX_FEEDS} feeds, que es el máximo. Quitá alguno para agregar otro.` };
  if (meta.feeds.some((f) => f.url === url)) return { ok: false, mensaje: "Ese feed ya está cargado." };

  // Se prueba antes de guardarlo, para no dejar enlaces rotos.
  try {
    await leerFeed(url, red);
  } catch (e) {
    return {
      ok: false,
      mensaje: "Revisá los campos marcados.",
      errores: { url: e instanceof ErrorFeed ? e.message : "No se pudo leer ese enlace." },
    };
  }

  const id = newId();
  await mutateDb((db) => {
    db.meta.feeds.push({
      id,
      nombre: nombre || new URL(url).hostname,
      url,
      red,
      creada: new Date().toISOString(),
      ultima: null,
      nuevas: 0,
      fusionadas: 0,
    });
  });

  const r = await sincronizarFeed(id).catch((e) => ({ nuevas: 0, fusionadas: 0, error: e instanceof ErrorFeed ? e.message : "No se pudo importar." }));
  refrescar();
  const primero = resumenFeed(r);
  return { ok: primero.ok, mensaje: `Feed agregado. ${primero.mensaje}` };
}

export async function importarFeedAhora(id: string): Promise<FormState> {
  await requerirAdmin();
  try {
    const r = await sincronizarFeed(id);
    refrescar();
    return resumenFeed(r);
  } catch (e) {
    return { ok: false, mensaje: e instanceof ErrorFeed ? e.message : "No se pudo importar. Probá de nuevo en un rato." };
  }
}

export async function quitarFeed(id: string) {
  await requerirAdmin();
  await mutateDb((db) => {
    db.meta.feeds = db.meta.feeds.filter((f) => f.id !== id);
  });
  refrescar();
}

export async function generarClaveWebhook(): Promise<FormState> {
  await requerirAdmin();
  const clave = nuevaClave();
  await mutateDb((db) => {
    db.meta.webhook.claveHash = huella(clave);
    db.meta.webhook.creada = new Date().toISOString();
  });
  refrescar();
  return { ok: true, mensaje: "Clave generada. Copiala ahora: no se vuelve a mostrar.", clave };
}

export async function desactivarWebhook() {
  await requerirAdmin();
  await mutateDb((db) => {
    db.meta.webhook.claveHash = null;
    db.meta.webhook.creada = null;
  });
  refrescar();
}
