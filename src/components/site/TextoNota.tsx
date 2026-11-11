import type { Bloque, Contenido, ItemLista, Lista, Marca, Tramo } from "@/lib/contenido";
import { incrustar } from "@/lib/embeds";
import { srcImagen, srcVideo } from "@/lib/imagen-url";
import { IncrustadoVista } from "./Incrustados";

/** Envuelve un tramo de texto con sus marcas, de afuera hacia adentro. */
function conMarcas(texto: string, marcas: Marca[] = []): React.ReactNode {
  return marcas.reduce<React.ReactNode>((dentro, m) => {
    switch (m.type) {
      case "bold":
        return <strong>{dentro}</strong>;
      case "italic":
        return <em>{dentro}</em>;
      case "underline":
        return <u>{dentro}</u>;
      case "strike":
        return <s>{dentro}</s>;
      case "link": {
        const web = /^https?:/i.test(m.attrs.href);
        return (
          <a href={m.attrs.href} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {dentro}
          </a>
        );
      }
    }
  }, texto);
}

function Tramos({ tramos }: { tramos?: Tramo[] }) {
  return (tramos ?? []).map((t, i) => (t.type === "hardBreak" ? <br key={i} /> : <span key={i}>{conMarcas(t.text, t.marks)}</span>));
}

function ListaVista({ lista }: { lista: Lista }) {
  const Etiqueta = lista.type === "orderedList" ? "ol" : "ul";
  return (
    <Etiqueta>
      {lista.content.map((item: ItemLista, i) => (
        <li key={i}>
          {item.content.map((h, j) =>
            h.type === "paragraph" ? (
              <p key={j}>
                <Tramos tramos={h.content} />
              </p>
            ) : (
              <ListaVista key={j} lista={h} />
            ),
          )}
        </li>
      ))}
    </Etiqueta>
  );
}

function BloqueVista({ b, titulo }: { b: Bloque; titulo: string }) {
  switch (b.type) {
    case "paragraph":
      return (
        <p>
          <Tramos tramos={b.content} />
        </p>
      );
    case "heading": {
      const Etiqueta = b.attrs.level === 3 ? "h3" : "h2";
      return (
        <Etiqueta>
          <Tramos tramos={b.content} />
        </Etiqueta>
      );
    }
    case "blockquote":
      return (
        <blockquote>
          {b.content.map((p, i) => (
            <p key={i}>
              <Tramos tramos={p.content} />
            </p>
          ))}
        </blockquote>
      );
    case "bulletList":
    case "orderedList":
      return <ListaVista lista={b} />;
    case "foto":
      return (
        <figure>
          <div className="flex justify-center overflow-hidden rounded-2xl bg-ink">
            {/* Las fotos ya se reducen y pasan a WebP al subirlas, no hace falta el optimizador. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcImagen(b.attrs.src)}
              alt={b.attrs.epigrafe || titulo}
              loading="lazy"
              decoding="async"
              className="max-h-[44rem] w-auto max-w-full"
            />
          </div>
          {b.attrs.epigrafe ? <figcaption className="mt-2 text-sm leading-snug text-ink/60">{b.attrs.epigrafe}</figcaption> : null}
        </figure>
      );
    case "video":
      return (
        <figure className="overflow-hidden rounded-2xl bg-ink">
          <video src={srcVideo(b.attrs.src)} controls playsInline preload="metadata" className="aspect-video w-full bg-ink object-contain">
            Tu navegador no puede reproducir este video.
          </video>
        </figure>
      );
    case "incrustado": {
      const e = incrustar(b.attrs.url);
      return e ? <IncrustadoVista e={e} titulo={titulo} /> : null;
    }
  }
}

/** El texto de una nota escrita con el editor: párrafos con formato y, entre medio, fotos, videos e incrustados. */
export function TextoNota({ doc, titulo, className }: { doc: Contenido; titulo: string; className?: string }) {
  return (
    <div className={`texto-nota ${className ?? ""}`}>
      {doc.content.map((b, i) => (
        <BloqueVista key={i} b={b} titulo={titulo} />
      ))}
    </div>
  );
}
