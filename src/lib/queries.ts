import { cacheLife, cacheTag } from "next/cache";
import { readDb } from "./store";

/**
 * Lecturas públicas. Quedan en caché y el panel las renueva con
 * updateTag("contenido") apenas se guarda un cambio.
 */

export async function getAjustes() {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  return (await readDb()).ajustes;
}

export async function getNoticias() {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { noticias } = await readDb();
  return noticias
    .filter((n) => n.publicada)
    .sort((a, b) => b.creada.localeCompare(a.creada));
}

export async function getNoticia(slug: string) {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { noticias } = await readDb();
  return noticias.find((n) => n.slug === slug && n.publicada) ?? null;
}

/** La sección de videos. Las notas que quedaron de cuando también admitía notas no se muestran. */
export async function getVideos() {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { sinCensura } = await readDb();
  return sinCensura
    .filter((p) => p.publicada && p.tipo === "video")
    .sort((a, b) => b.creada.localeCompare(a.creada));
}

export async function getVideo(slug: string) {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { sinCensura } = await readDb();
  return sinCensura.find((p) => p.slug === slug && p.publicada && p.tipo === "video") ?? null;
}

export async function getAnuncios() {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { anuncios } = await readDb();
  return anuncios.filter((a) => a.activo);
}

/** Los medios aliados que se muestran, en el orden en que se cargaron en el panel. */
export async function getMediosAmigos() {
  "use cache";
  cacheTag("contenido");
  cacheLife("minutes");
  const { mediosAmigos } = await readDb();
  return mediosAmigos.filter((m) => m.activo);
}
