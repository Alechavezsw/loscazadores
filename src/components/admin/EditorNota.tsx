"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditor,
  useEditorState,
  type Editor,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  FrameCorners,
  ImageSquare,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  Trash,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { enlaceSeguro, MAX_FOTOS, type Contenido } from "@/lib/contenido";
import { incrustar, NOMBRE_PROVEEDOR } from "@/lib/embeds";
import { srcImagen, srcVideo } from "@/lib/imagen-url";
import { maxVideoMb, subirFoto, subirVideo } from "@/lib/subir-medios";
import type { ModoVideo } from "@/lib/video-limites";
import { botonSecundario, input } from "./ui";

// ───────────────────────── bloques propios: foto, video e incrustado ─────────────────────────

const marcoBloque = (elegido: boolean) =>
  cn("relative overflow-hidden rounded-xl border bg-white transition-colors duration-300", elegido ? "border-ink ring-2 ring-ink/20" : "border-line");

function Quitar({ alQuitar, que }: { alQuitar: () => void; que: string }) {
  return (
    <button
      type="button"
      onClick={alQuitar}
      aria-label={`Quitar ${que}`}
      title={`Quitar ${que}`}
      className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-ink/80 text-white backdrop-blur transition-colors duration-300 hover:bg-hunter"
    >
      <Trash weight="bold" className="size-4" aria-hidden />
    </button>
  );
}

function FotoVista({ node, selected, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const { src, epigrafe } = node.attrs as { src: string; epigrafe: string };
  return (
    <NodeViewWrapper as="figure" data-drag-handle className={marcoBloque(selected)}>
      <Quitar alQuitar={deleteNode} que="la foto" />
      <div className="flex justify-center bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={srcImagen(src)} alt="" draggable={false} className="max-h-[28rem] w-auto max-w-full" />
      </div>
      <input
        value={epigrafe}
        onChange={(e) => updateAttributes({ epigrafe: e.target.value })}
        maxLength={200}
        placeholder="Epígrafe de la foto (opcional)"
        aria-label="Epígrafe de la foto"
        className="w-full border-t border-line bg-white px-3 py-2 text-sm outline-none placeholder:text-ink/40 focus:bg-paper"
      />
    </NodeViewWrapper>
  );
}

function VideoVista({ node, selected, deleteNode }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper data-drag-handle className={marcoBloque(selected)}>
      <Quitar alQuitar={deleteNode} que="el video" />
      <video src={srcVideo(String(node.attrs.src))} controls preload="metadata" playsInline className="aspect-video w-full bg-ink object-contain">
        Tu navegador no puede mostrar este video.
      </video>
    </NodeViewWrapper>
  );
}

function IncrustadoVista({ node, selected, deleteNode }: ReactNodeViewProps) {
  const url = String(node.attrs.url);
  const e = incrustar(url);
  return (
    <NodeViewWrapper data-drag-handle className={cn(marcoBloque(selected), "flex items-center gap-3 p-4 pr-14")}>
      <Quitar alQuitar={deleteNode} que="el enlace incrustado" />
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
        <FrameCorners weight="bold" className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{e ? `${NOMBRE_PROVEEDOR[e.proveedor]}: se va a ver dentro de la nota` : "Enlace que no se reconoce"}</span>
        <span className="block truncate font-code text-xs text-ink/60">{url}</span>
      </span>
    </NodeViewWrapper>
  );
}

/**
 * Un bloque que no lleva texto adentro: se mueve y se borra entero. Va en su propio grupo («medio») para que
 * solo pueda estar suelto entre los párrafos, nunca dentro de una lista o de una cita.
 */
function bloque(nombre: string, atributos: Record<string, string>, vista: React.ComponentType<ReactNodeViewProps>) {
  return Node.create({
    name: nombre,
    group: "medio",
    atom: true,
    draggable: true,
    addAttributes() {
      return Object.fromEntries(Object.entries(atributos).map(([k, v]) => [k, { default: v }]));
    },
    parseHTML() {
      return [{ tag: `div[data-bloque="${nombre}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes({ "data-bloque": nombre }, HTMLAttributes)];
    },
    addNodeView() {
      return ReactNodeViewRenderer(vista);
    },
  });
}

const EXTENSIONES = [
  // El documento admite, además de texto, las fotos, los videos y los incrustados en el primer nivel.
  Node.create({ name: "doc", topNode: true, content: "(block | medio)+" }),
  StarterKit.configure({
    document: false,
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto", "tel"] },
  }),
  Placeholder.configure({ placeholder: "Escribí acá la noticia…" }),
  bloque("foto", { src: "", epigrafe: "" }, FotoVista),
  bloque("video", { src: "" }, VideoVista),
  bloque("incrustado", { url: "" }, IncrustadoVista),
];

// ───────────────────────── barra de herramientas ─────────────────────────

function Boton({
  activo = false,
  deshabilitado = false,
  titulo,
  alTocar,
  children,
}: {
  activo?: boolean;
  deshabilitado?: boolean;
  titulo: string;
  alTocar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      disabled={deshabilitado}
      // Sin esto el botón le saca el foco al texto y se pierde lo seleccionado.
      onMouseDown={(e) => e.preventDefault()}
      onClick={alTocar}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40",
        activo ? "bg-ink text-white" : "text-ink hover:bg-ink/10",
      )}
    >
      {children}
    </button>
  );
}

const Separador = () => <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />;

type Panel = null | "enlace" | "incrustar";

type Props = {
  /** Lo que ya tiene la nota, o vacío si es nueva. */
  inicial: Contenido;
  modoVideo: ModoVideo;
  error?: string;
  /** Avisa al formulario para que no se pueda enviar mientras hay algo subiendo. */
  alCambiarOcupado: (ocupado: boolean) => void;
};

/**
 * El editor del texto de la noticia: formato (negrita, subtítulos, listas, citas, enlaces) y, entre los párrafos,
 * fotos, videos subidos y publicaciones incrustadas. Lo escrito viaja en el campo oculto `contenido`.
 */
export function EditorNota({ inicial, modoVideo, error, alCambiarOcupado }: Props) {
  const [json, setJson] = useState(() => JSON.stringify(inicial));
  const [panel, setPanel] = useState<Panel>(null);
  const [valorPanel, setValorPanel] = useState("");
  const [errorPanel, setErrorPanel] = useState<string | null>(null);
  const [subida, setSubida] = useState<{ texto: string; progreso?: number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Lo subido en esta pantalla: si al guardar no quedó en el texto, el servidor lo borra.
  const [subidos, setSubidos] = useState<string[]>([]);
  const control = useRef<AbortController | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const subirFotosRef = useRef<(archivos: File[]) => void>(() => undefined);

  const editor = useEditor({
    // La página llega armada del servidor: el editor se crea recién en el navegador.
    immediatelyRender: false,
    extensions: EXTENSIONES,
    content: inicial,
    editorProps: {
      attributes: {
        id: "cuerpo",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": "cuerpo-etiqueta",
        class: "texto-nota min-h-80 px-4 py-4 outline-none",
      },
      // Pegar o arrastrar una foto desde la computadora la sube y la pone en el texto.
      handlePaste: (_vista, evento) => {
        const fotos = [...(evento.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (fotos.length === 0) return false;
        evento.preventDefault();
        subirFotosRef.current(fotos);
        return true;
      },
      handleDrop: (_vista, evento, _trozo, movido) => {
        if (movido) return false;
        const fotos = [...(evento.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (fotos.length === 0) return false;
        evento.preventDefault();
        subirFotosRef.current(fotos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => setJson(JSON.stringify(e.getJSON())),
  });

  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      negrita: e?.isActive("bold") ?? false,
      cursiva: e?.isActive("italic") ?? false,
      subrayado: e?.isActive("underline") ?? false,
      tachado: e?.isActive("strike") ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      lista: e?.isActive("bulletList") ?? false,
      numerada: e?.isActive("orderedList") ?? false,
      cita: e?.isActive("blockquote") ?? false,
      enlace: e?.isActive("link") ?? false,
      deshacer: e?.can().undo() ?? false,
      rehacer: e?.can().redo() ?? false,
    }),
  });

  useEffect(() => () => control.current?.abort(), []);

  const ocupado = subida !== null;
  const listo = Boolean(editor) && !ocupado;

  function empezar(texto: string) {
    const ctl = new AbortController();
    control.current = ctl;
    setAviso(null);
    setSubida({ texto });
    alCambiarOcupado(true);
    return ctl;
  }

  function terminar() {
    control.current = null;
    setSubida(null);
    alCambiarOcupado(false);
  }

  function mensajeDe(err: unknown, porDefecto: string) {
    const msg = err instanceof Error ? err.message : "";
    return /autorizado|entrar al panel/i.test(msg) ? "Tu sesión venció. Volvé a entrar al panel." : msg || porDefecto;
  }

  const cancelada = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

  /** Pone una foto, un video o un incrustado después del bloque donde está el cursor, o en su lugar si es un párrafo vacío. */
  function insertar(e: Editor, nodo: { type: string; attrs: Record<string, string> }) {
    const { selection } = e.state;
    const { $from, $to } = selection;
    let desde = selection.to;
    let hasta = selection.to;
    // Con depth 0 lo seleccionado es un bloque entero (otra foto, por ejemplo): lo nuevo va después.
    if ($from.depth > 0) {
      const actual = $to.node(1);
      hasta = $to.after(1);
      desde = actual.type.name === "paragraph" && actual.content.size === 0 ? $to.before(1) : hasta;
    }
    e.chain().insertContentAt({ from: desde, to: hasta }, nodo).run();
    // Después va un párrafo vacío con el cursor: lo próximo que se sume cae justo ahí, pegado a esto.
    // (Los párrafos vacíos no se guardan, así que no dejan huecos en la nota.)
    const despues = desde + 1;
    const sigue = e.state.doc.resolve(despues).nodeAfter;
    if (!(sigue?.type.name === "paragraph" && sigue.content.size === 0)) {
      e.chain().insertContentAt(despues, { type: "paragraph" }).run();
    }
    e.commands.focus(despues + 1);
  }

  async function subirFotos(archivos: File[]) {
    if (!editor || control.current) return;
    const yaHay = editor.getJSON().content?.filter((b) => b.type === "foto").length ?? 0;
    const lugar = MAX_FOTOS - yaHay;
    if (lugar <= 0) {
      setAviso(`El texto puede llevar hasta ${MAX_FOTOS} fotos.`);
      return;
    }
    const lista = archivos.slice(0, lugar);
    const ctl = empezar("Subiendo la foto…");
    try {
      for (const [i, archivo] of lista.entries()) {
        if (lista.length > 1) setSubida({ texto: `Subiendo la foto ${i + 1} de ${lista.length}…` });
        const valor = await subirFoto(archivo, ctl.signal);
        setSubidos((s) => [...s, valor]);
        insertar(editor, { type: "foto", attrs: { src: valor, epigrafe: "" } });
      }
      if (archivos.length > lista.length) setAviso(`Se subieron ${lista.length}: el texto puede llevar hasta ${MAX_FOTOS} fotos.`);
    } catch (err) {
      if (!cancelada(err)) setAviso(mensajeDe(err, "No se pudo subir la foto. Probá de nuevo."));
    } finally {
      terminar();
    }
  }
  // Los manejadores de pegar y arrastrar se arman una sola vez: llegan a la versión actual por esta referencia.
  useEffect(() => {
    subirFotosRef.current = (archivos) => void subirFotos(archivos);
  });

  async function subirUnVideo(archivo: File) {
    if (!editor || control.current) return;
    const ctl = empezar("Subiendo el video…");
    try {
      const valor = await subirVideo(archivo, modoVideo, (n) => setSubida({ texto: "Subiendo el video…", progreso: n }), ctl.signal);
      setSubidos((s) => [...s, valor]);
      insertar(editor, { type: "video", attrs: { src: valor } });
    } catch (err) {
      if (!cancelada(err)) setAviso(mensajeDe(err, "No se pudo subir el video. Probá de nuevo."));
    } finally {
      terminar();
    }
  }

  function abrirPanel(cual: Exclude<Panel, null>) {
    if (panel === cual) {
      cerrarPanel();
      return;
    }
    setErrorPanel(null);
    setValorPanel(cual === "enlace" ? String(editor?.getAttributes("link").href ?? "") : "");
    setPanel(cual);
  }

  function cerrarPanel() {
    setPanel(null);
    setErrorPanel(null);
    editor?.commands.focus();
  }

  function aplicarPanel() {
    if (!editor) return;
    if (panel === "enlace") {
      const href = enlaceSeguro(valorPanel);
      if (!href) {
        setErrorPanel("Ese enlace no es válido. Pegá la dirección completa, por ejemplo https://sitio.com/pagina.");
        return;
      }
      const cadena = editor.chain().focus();
      // Sin nada seleccionado y fuera de un enlace, se escribe la dirección misma como enlace.
      if (editor.state.selection.empty && !editor.isActive("link")) {
        cadena.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
      } else {
        cadena.extendMarkRange("link").setLink({ href }).run();
      }
    } else if (panel === "incrustar") {
      const e = incrustar(valorPanel);
      if (!e) {
        setErrorPanel("No se reconoce ese enlace. Sirven YouTube, Vimeo, TikTok, Facebook e Instagram.");
        return;
      }
      insertar(editor, { type: "incrustado", attrs: { url: e.url } });
    }
    setPanel(null);
    setErrorPanel(null);
  }

  function quitarEnlace() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setPanel(null);
  }

  const cadena = () => editor!.chain().focus();
  const mensaje = aviso ?? error;

  return (
    <div className="flex flex-col gap-1">
      <span id="cuerpo-etiqueta" className="text-sm font-semibold">
        Texto de la noticia
      </span>
      <input type="hidden" name="contenido" value={json} />
      <input type="hidden" name="medios_subidos" value={JSON.stringify(subidos)} />

      <div
        className={cn(
          "rounded-lg border bg-white transition-colors duration-700 ease-fluid focus-within:border-ink",
          mensaje ? "border-hunter" : "border-line",
        )}
      >
        <div
          role="toolbar"
          aria-label="Formato del texto"
          className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-line bg-paper px-2 py-1.5"
        >
          <Boton titulo="Negrita (Ctrl+B)" activo={estado?.negrita} deshabilitado={!listo} alTocar={() => cadena().toggleBold().run()}>
            <TextB weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Cursiva (Ctrl+I)" activo={estado?.cursiva} deshabilitado={!listo} alTocar={() => cadena().toggleItalic().run()}>
            <TextItalic weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Subrayado (Ctrl+U)" activo={estado?.subrayado} deshabilitado={!listo} alTocar={() => cadena().toggleUnderline().run()}>
            <TextUnderline weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Tachado" activo={estado?.tachado} deshabilitado={!listo} alTocar={() => cadena().toggleStrike().run()}>
            <TextStrikethrough weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Separador />
          <Boton titulo="Subtítulo" activo={estado?.h2} deshabilitado={!listo} alTocar={() => cadena().toggleHeading({ level: 2 }).run()}>
            <TextHTwo weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Subtítulo chico" activo={estado?.h3} deshabilitado={!listo} alTocar={() => cadena().toggleHeading({ level: 3 }).run()}>
            <TextHThree weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Lista con viñetas" activo={estado?.lista} deshabilitado={!listo} alTocar={() => cadena().toggleBulletList().run()}>
            <ListBullets weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Lista numerada" activo={estado?.numerada} deshabilitado={!listo} alTocar={() => cadena().toggleOrderedList().run()}>
            <ListNumbers weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Cita destacada" activo={estado?.cita} deshabilitado={!listo} alTocar={() => cadena().toggleBlockquote().run()}>
            <Quotes weight="fill" className="size-5" aria-hidden />
          </Boton>
          <Boton titulo="Enlace" activo={estado?.enlace || panel === "enlace"} deshabilitado={!listo} alTocar={() => abrirPanel("enlace")}>
            <LinkSimple weight="bold" className="size-5" aria-hidden />
          </Boton>
          <Separador />
          <Boton titulo="Agregar fotos al texto" deshabilitado={!listo} alTocar={() => fotoRef.current?.click()}>
            <ImageSquare weight="bold" className="size-5" aria-hidden />
            Foto
          </Boton>
          <Boton titulo={`Agregar un video al texto (MP4 o WebM, hasta ${maxVideoMb(modoVideo)} MB)`} deshabilitado={!listo} alTocar={() => videoRef.current?.click()}>
            <VideoCamera weight="bold" className="size-5" aria-hidden />
            Video
          </Boton>
          <Boton titulo="Incrustar un video o una publicación de YouTube, Vimeo, TikTok, Facebook o Instagram" activo={panel === "incrustar"} deshabilitado={!listo} alTocar={() => abrirPanel("incrustar")}>
            <FrameCorners weight="bold" className="size-5" aria-hidden />
            Incrustar
          </Boton>
          <span className="ml-auto flex items-center gap-0.5">
            <Boton titulo="Deshacer (Ctrl+Z)" deshabilitado={!listo || !estado?.deshacer} alTocar={() => cadena().undo().run()}>
              <ArrowUUpLeft weight="bold" className="size-5" aria-hidden />
            </Boton>
            <Boton titulo="Rehacer (Ctrl+Y)" deshabilitado={!listo || !estado?.rehacer} alTocar={() => cadena().redo().run()}>
              <ArrowUUpRight weight="bold" className="size-5" aria-hidden />
            </Boton>
          </span>
        </div>

        {panel ? (
          <div className="flex flex-col gap-2 border-b border-line bg-paper/60 px-3 py-3">
            <label htmlFor="editor-panel" className="text-xs font-semibold">
              {panel === "enlace" ? "Dirección del enlace" : "Enlace de YouTube, Vimeo, TikTok, Facebook o Instagram"}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="editor-panel"
                autoFocus
                inputMode="url"
                spellCheck={false}
                placeholder="https://"
                value={valorPanel}
                onChange={(e) => {
                  setValorPanel(e.target.value);
                  setErrorPanel(null);
                }}
                onKeyDown={(e) => {
                  // Enter aplica acá: no tiene que enviar el formulario de la noticia.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicarPanel();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cerrarPanel();
                  }
                }}
                aria-invalid={errorPanel ? true : undefined}
                className={cn(input, "min-w-0 flex-1 basis-64 py-1.5 text-sm")}
              />
              <button type="button" onClick={aplicarPanel} className={cn(botonSecundario, "border-ink bg-ink px-3 py-1.5 text-sm text-white hover:bg-hunter")}>
                {panel === "enlace" ? "Poner enlace" : "Incrustar"}
              </button>
              {panel === "enlace" && estado?.enlace ? (
                <button type="button" onClick={quitarEnlace} className={cn(botonSecundario, "px-3 py-1.5 text-sm hover:border-hunter hover:text-hunter")}>
                  Quitar enlace
                </button>
              ) : null}
              <button type="button" onClick={cerrarPanel} className={cn(botonSecundario, "px-3 py-1.5 text-sm")}>
                Cancelar
              </button>
            </div>
            {errorPanel ? (
              <p role="alert" className="text-xs font-semibold text-hunter">
                {errorPanel}
              </p>
            ) : null}
          </div>
        ) : null}

        {subida ? (
          <div aria-live="polite" className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/60 px-3 py-2 text-sm font-semibold">
            <span>
              {subida.texto}
              {subida.progreso !== undefined ? ` ${Math.round(subida.progreso)} %` : ""}
            </span>
            {subida.progreso !== undefined ? (
              <span className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-hunter transition-all duration-700 ease-fluid" style={{ width: `${subida.progreso}%` }} />
              </span>
            ) : null}
            <button type="button" onClick={() => control.current?.abort()} className={cn(botonSecundario, "ml-auto px-3 py-1 text-sm")}>
              Cancelar
            </button>
          </div>
        ) : null}

        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          // Mientras carga el editor se ve el mismo hueco, para que la página no salte.
          <div aria-hidden className="min-h-80 px-4 py-4 text-lg text-ink/40">
            Cargando el editor…
          </div>
        )}
      </div>

      <input
        ref={fotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => {
          const archivos = [...(e.target.files ?? [])];
          e.target.value = "";
          if (archivos.length > 0) void subirFotos(archivos);
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (archivo) void subirUnVideo(archivo);
        }}
      />

      {mensaje ? (
        <p id="cuerpo-error" role="alert" className="flex items-start gap-1 text-xs font-semibold text-hunter">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
          {mensaje}
        </p>
      ) : (
        <p className="text-xs text-ink/60">
          Seleccioná texto para darle formato. Con los botones Foto, Video e Incrustar sumás todo lo que quieras entre los párrafos; también podés
          pegar o arrastrar fotos.
        </p>
      )}
    </div>
  );
}
