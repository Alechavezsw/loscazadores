# Los Cazadores de Noticias

Sitio de noticias en Next.js 16 con panel de administración. Muestra lo último de cada canal
(WhatsApp, Instagram, Facebook y YouTube), las noticias propias y la transmisión en vivo.

## Cómo correrlo

```bash
npm install
npm run dev -- -p 3030
```

- Sitio: http://localhost:3030
- Panel: http://localhost:3030/admin (la contraseña está en `.env.local`, variable `ADMIN_PASSWORD`)

Para producción: `npm run build` y `npm start`. Copiá `.env.example` a `.env.local` y completá
`ADMIN_PASSWORD`, `SESSION_SECRET` y `NEXT_PUBLIC_SITE_URL`.

## Cómo se usa el panel

- **Noticias**: título, texto, foto, categoría y barrio. Se marca en qué redes se publicó; esa marca decide
  en qué columna de la portada aparece. Si se pega el enlace de la publicación original, el botón
  "Ver en Instagram / Facebook / …" la abre, y la nota muestra el embed oficial.
  "Última hora" va primero en la cinta roja (sus titulares son las noticias reales, no un texto de muestra) y
  "Destacada" ocupa el lugar grande. El campo **Espacio de la portada** manda la noticia a Viva Feria o a Sí San
  Juan: cada uno tiene su bloque en la portada y su página (`/viva-feria`, `/si-san-juan`), y esas noticias no se
  repiten en las últimas noticias. Cada edición de Viva Feria es una noticia nueva con ese espacio.
- **Videos**: la sección de videos (hoy "Sin censura"; vive en `/videos`, y `/sin-censura` redirige ahí). Solo
  admite videos, subidos o incrustados. El principal (o el más reciente) se ve grande en la portada con el botón
  "Ver todo". Las notas que quedaron de la versión anterior no se muestran.
- **Publicidad**: laterales de las columnas y grilla de promociones. Los espacios libres muestran
  "Tu marca acá" con un enlace a WhatsApp para consultar.
- **Redes**: importa solo lo que publicás en Instagram y Facebook (ver más abajo).
- **Ajustes**: lema, aviso legal, los textos de la portada (frase institucional y la invitación «Tu historia
  también cuenta»), el **nombre de la sección de videos** (Sin censura o Sin filtro: se cambia en el menú, los
  títulos y el pie al guardar), enlaces de las redes, canal de YouTube, **TOMATEVE**, enlace de Radio del Sur y
  WhatsApp de contacto (se muestra grande en la portada, con enlace directo).

## Videos e incrustados en las notas

Al cargar o editar una noticia hay dos campos nuevos:

- **Video**: se sube un MP4 (H.264) o un WebM de hasta 200 MB. Se ve en la nota en el lugar de la foto, con la
  foto de portada como carátula. Los `.mov` de iPhone a veces no se ven en todos los navegadores: conviene MP4.
  No se convierten ni se recortan. En la portada y en los listados, la nota lleva una insignia "Video".
- **Incrustar**: se pega un enlace por línea, o el código de insertar (iframe), de YouTube, Vimeo, TikTok,
  Facebook o Instagram. Aparecen dentro de la nota, debajo del texto. El panel avisa al instante cuáles se
  reconocen. Nunca se publica el código tal cual: se saca la dirección y el iframe se arma desde cero, y solo con
  esos cinco servicios (YouTube va por `youtube-nocookie.com`). Los enlaces cortos de TikTok (`vm.tiktok.com`) no se
  pueden resolver: hay que pegar el enlace largo. Para un video largo conviene subirlo a YouTube e incrustarlo.

Dónde se guardan los videos:

- **En Vercel** (con `BLOB_READ_WRITE_TOKEN`): el navegador los sube **directo a Vercel Blob**, sin pasar por el
  servidor, porque una función de Vercel no recibe pedidos de más de 4,5 MB. El permiso de subida solo se da a
  quien está en el panel, solo para videos hasta 200 MB y dentro de la carpeta `videos/`. Los videos consumen
  almacenamiento y transferencia de Blob: conviene mirar los límites del plan.
- **En tu computadora**: van a `data/uploads/videos` y se sirven desde `/media/video/…` con soporte para
  adelantar y retroceder. Se verifica el tipo declarado y los primeros bytes del archivo.

Si en el formulario se reemplaza o se quita un video recién subido que todavía no se guardó, se borra solo. Si se
cierra la página sin guardar, ese video queda sin usar y hay que borrarlo a mano desde Blob o del disco.

## YouTube en vivo

Tres modos en Ajustes:

- **Automático**: cada minuto el servidor mira la página `/live` del canal. Si está transmitiendo, el
  video aparece arriba de la portada, en la página `/en-vivo` y se marca "En vivo" en la barra.
  No usa API key. Está basado en la estructura pública de YouTube, que puede cambiar; si deja de
  detectar, usá el modo manual mientras se ajusta `src/lib/live.ts`.
- **Manual**: se pega el video que está en vivo.
- **Apagado**.

El botón "Probar ahora" consulta a YouTube con lo escrito en el formulario, sin guardar.

## TOMATEVE y Se Armó el Bailongo

- **TOMATEVE**: en Ajustes se carga el canal de YouTube. La portada pregunta cada minuto (`/api/live?canal=tomateve`,
  misma detección que el canal propio) y, cuando está en vivo, muestra el video solo, sin sonido (los navegadores no
  dejan sonar a una página hasta que la persona lo pide) y con la insignia EN VIVO. Fuera de horario muestra cuándo
  vuelve al aire: lunes y jueves de 22:00 a 00:00, hora de San Juan (`src/lib/programas.ts`). El logo no está
  cargado: hoy se escribe el nombre en texto.
- **Se Armó el Bailongo**: el espacio lleva el texto del programa y un reproductor de audio con la señal de Radio del
  Sur (la misma del reproductor flotante de los sábados, que nunca suena a la vez: se avisan entre sí con
  `src/lib/radio-bus.ts`). Si en Ajustes se carga el enlace de la radio, aparece el botón para escucharla en su sitio.

## Importar de Instagram y Facebook

La pantalla **Redes** del panel ofrece tres formas de traer lo que publicás. Se pueden usar juntas. En todas,
el sitio crea la noticia con el texto, baja la foto a tu servidor (las direcciones de imagen de las redes
caducan) y la enlaza a la publicación original. Si el mismo texto salió en Instagram y Facebook con menos de
48 horas de diferencia, se une en una sola noticia con las dos redes. Lo ya importado nunca se repite ni se
pisa, así que podés editar las noticias importadas sin miedo.

En todas las vías oficiales Instagram tiene que ser una cuenta profesional (Empresa o Creador) vinculada a la
Página de Facebook.

### 1. Avisos desde Make o Zapier (webhook)

No hace falta crear ninguna app de Meta: en Make o Zapier te conectás con tu login de Facebook. Cada vez que
publicás, la herramienta le avisa al sitio. Funciona cuando el sitio está publicado en internet (Make y Zapier
no llegan a `localhost`).

1. En Redes, **Generar clave**. Se muestra una sola vez; en el sitio solo queda su huella.
2. La herramienta manda un POST a `https://tu-sitio/api/importar` con el encabezado
   `Authorization: Bearer <clave>` (o `?clave=` en la dirección si no deja poner encabezados).
3. Acepta JSON o formulario. Campos: `enlace` (obligatorio), `texto`, `imagen`, `red`, `id`, `fecha`. También
   entiende los nombres de la API de Meta (`caption`, `message`, `media_url`, `thumbnail_url`, `permalink`,
   `permalink_url`, `timestamp`, `created_time`). Si el enlace es de instagram.com o facebook.com, la red se
   deduce sola; si no, se puede pasar `?red=instagram` en la dirección.
4. En Make conviene el cuerpo `application/x-www-form-urlencoded`, así los textos con comillas o saltos de
   línea no rompen el aviso.

El panel muestra los últimos avisos con su resultado (nueva, unida, repetida o error y el motivo). Hay un freno
contra adivinar la clave: 20 intentos fallidos bloquean esa dirección por 10 minutos.

### 2. Enlaces de feed

Servicios como Behold (Instagram) o RSS.app se conectan a tu cuenta y te dan un enlace con tus publicaciones.
Se pega en Redes, se prueba al instante y el sitio lo revisa solo. Entiende el JSON de Behold, JSON Feed, RSS
y Atom. Funciona también desde tu computadora. Algunos servicios tienen plan gratis con límites y otros son
pagos.

### 3. Conexión directa con Meta (la API oficial)

Es la opción de más control y sin terceros, pero hay que crear una app propia en developers.facebook.com.

1. Copiá el ID y la clave secreta de la app a `.env.local` como `META_APP_ID` y `META_APP_SECRET`, y reiniciá el
   servidor. Esa clave nunca llega al navegador.
2. Generá un token de usuario en el Explorador de la Graph API con los permisos `pages_show_list`,
   `pages_read_engagement` e `instagram_basic`, y pegalo en Redes una sola vez. El sitio lo canjea por uno de
   60 días y de ahí guarda el token de la Página, que no vence mientras no cambies la contraseña de Facebook.

La versión de la API está fija en `v25.0` (`META_GRAPH_VERSION` para cambiarla).

### Cuándo se revisa y qué pasa con lo importado

- La conexión con Meta y los feeds se revisan solos cada 5 a 60 minutos (se elige en el panel): con un
  servidor propio, por un reloj interno; en Vercel, por las visitas y el cron (ver Publicar en Vercel). Los avisos de Make o Zapier llegan cuando ellos los mandan. Hay botones para importar
  en el momento. Si el servidor no queda encendido, definí `CRON_SECRET` y llamá a `/api/sync` con
  `Authorization: Bearer <CRON_SECRET>` desde un cron.
- Se importan hasta 10 publicaciones por red en cada corrida con la API, 30 por feed.
- Se elige si lo importado se publica directo o queda como borrador, y con qué categoría.
- Si algo falla, el panel muestra el motivo. Si el token de Meta se invalida, avisa que hay que volver a
  conectar y el sincronizador deja de insistir.

### Seguridad

- Las descargas de fotos y feeds solo aceptan enlaces https públicos: se bloquean direcciones internas
  (localhost, redes privadas, metadatos de la nube), puertos especiales, enlaces con usuario y redirecciones a
  la red interna.
- El token de la Página, la clave del aviso y las direcciones completas de los feeds se quedan en el servidor
  (en la base, o en `data/db.json` en tu computadora) y no llegan al navegador.

## Dónde se guardan los datos

El sitio elige solo según el entorno:

- **En tu computadora** (sin `DATABASE_URL`): un archivo `data/db.json` y las fotos en `data/uploads/`
  (carpeta ignorada por git, se puede mover con `DATA_DIR`). Las fotos se sirven desde `/media/…`.
- **En Vercel** (con `DATABASE_URL`): las noticias, anuncios, ajustes, la conexión con Meta y las fotos van
  a una base **Postgres** (Neon). Cada foto es una fila de `lc_imagenes` y se sirve desde `/media/…`. Las
  tablas se crean solas la primera vez. Cada cambio corre en una transacción con un candado, así que el
  panel, un aviso de Make y el cron pueden trabajar a la vez sin pisarse. **Blob** queda para los videos.

En los dos casos las fotos se reducen a 1600 px y se pasan a WebP. Desde el panel, además, el navegador las
achica antes de enviarlas (Vercel corta los pedidos de más de 4,5 MB, y una foto de celular pesa más).

Hasta que se guarde el primer cambio, el sitio muestra 5 noticias de ejemplo (marcadas "Ejemplo" en el
panel). Se borran juntas desde el Resumen. Los datos de tu computadora no se pasan solos a Vercel: ahí se
empieza de cero.

## Estadísticas

El panel tiene una pantalla **Estadísticas** (y un resumen de hoy en el inicio) con: visitantes y vistas, la
comparación con el período anterior, visitas por día u hora, páginas y noticias más leídas con su tiempo de
lectura, de dónde llegan (Google, Facebook, Instagram, WhatsApp, directo, campañas `utm_campaign`), aparato,
navegador y sistema, provincia y ciudad, a qué hora y qué días leen, cuántas personas hay conectadas ahora, los
clics en los botones importantes (enviar noticia, redes, compartir, radio) y las vistas y clics de cada anuncio.

- **Sin cookies y sin guardar IP.** Con la IP y el navegador se arma un código que cambia todos los días y solo se
  guardan contadores por día. Por eso no hace falta un aviso de cookies, y la política de privacidad ya lo explica.
- **No cuenta** robots, ni lo que hacés vos con la sesión del panel iniciada, ni avisos que vengan de otro sitio.
- **Dónde se guarda:** en tu computadora, en `data/stats.json` (se escribe cada pocos segundos); en Vercel, en dos
  tablas de la misma base Postgres (`lc_stats` y `lc_activos`, se crean solas). Los contadores no crecen con las
  visitas sino con la variedad de páginas, así que la base casi no engorda. Cada aviso del navegador es una
  llamada corta a `/api/e`, que cuenta como una invocación en Vercel.
- **Provincia y ciudad** salen de los encabezados que agrega Vercel: en tu computadora figuran como «Sin dato».
- `STATS_SALT` (opcional) es la clave secreta con la que se arma el código diario; si no está, se usa `SESSION_SECRET`.
  `ESTADISTICAS=off` apaga el conteo sin tocar el código.

## Publicar en Vercel

1. **Repositorio.** Subí el proyecto a GitHub. La app está en la carpeta `web`: si el repositorio tiene
   más cosas, en Vercel poné *Root Directory* en `web`.
2. **Proyecto.** En Vercel, *Add New, Project*, elegí el repositorio. Detecta Next.js solo.
3. **Almacenamiento.** En el proyecto, pestaña *Storage*: creá una base **Neon** (Postgres, desde el
   Marketplace) y conectala al proyecto en todos los entornos. Eso define `DATABASE_URL`. Las fotos quedan
   en esa base. Un **Blob** (`BLOB_READ_WRITE_TOKEN`) hace falta solo para subir videos.
4. **Variables** (*Settings, Environment Variables*):

   | Variable | Para qué |
   |---|---|
   | `ADMIN_PASSWORD` | Contraseña del panel. Usá una nueva, no la de tu computadora. |
   | `SESSION_SECRET` | Firma la sesión del panel. Una cadena larga y aleatoria. |
   | `CRON_SECRET` | Protege `/api/sync`. Vercel la manda sola al cron. Otra cadena aleatoria. |
   | `NEXT_PUBLIC_SITE_URL` | El dominio final con `https://`. Si falta, se usa el que Vercel le da al proyecto. |
   | `META_APP_ID`, `META_APP_SECRET` | Los de tu app de Meta (ver la sección de Meta). |

   Para generar una cadena aleatoria:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy.** Entrá a `https://tu-sitio/admin`, borrá los ejemplos y completá *Ajustes* y *Redes*.

Cómo se revisa lo pendiente en Vercel, que no tiene un proceso encendido todo el tiempo:

- **Avisos de Make o Zapier**: llegan solos y se importan al instante.
- **Visitas al sitio**: cada visitante consulta `/api/live` una vez por minuto y eso revisa si toca importar
  (según el intervalo del panel). Con poco tráfico de madrugada, la importación espera a la próxima visita.
- **Cron de Vercel** (`vercel.json`): una vez por día, como red de seguridad. Es lo máximo que permite el plan
  gratuito. Con un plan Pro se puede cambiar a `*/15 * * * *`.

Antes de importar se "reclama el turno" en la base, así que varias instancias llegando a la vez no importan
lo mismo dos veces.

## Estructura

```
src/app/(sitio)/        portada, noticias, nota, en vivo, videos, Viva Feria, Sí San Juan, privacidad, términos
src/app/admin/          login y panel (acciones en actions.ts)
src/app/api/live/       estado de la transmisión
src/app/api/importar/   recibe avisos de Make o Zapier
src/app/api/sync/       disparo de la importación (cron de Vercel o externo)
src/app/media/[name]/   sirve las fotos subidas
src/components/site/    piezas del sitio público
src/components/admin/   formularios y piezas del panel
src/lib/                datos (store: archivo o Postgres), sesión (auth), imágenes (base o disco),
                        YouTube (live), revisión periódica (pendientes, scheduler),
                        importación (sync, feeds, meta, webhook) y descargas seguras (red)
public/brand/           logo vectorizado y imagen para redes
```

El contenido público se guarda en caché y se renueva al instante cada vez que se guarda algo en el panel.
