# Design

## Context

- `scaena/` está vacío salvo `openspec/`. Ver proposal.md (Why) para la motivación.
- Regula (`../regula`) publica `@jotis-me/tokens`, `@jotis-me/icons` y `@jotis-me/react` 0.2.0. `@jotis-me/react` ya trae la familia Stream: `StreamAlert`, `StreamScene`, `StreamCountdown`, `CamFrame`, `ChatBox`, `ChatBadge`, `StreamGoal`, `StreamEvents`, `NowPlaying`, `StreamStatus`, `ChannelPanel` y `ChannelBanner`. Todas se dibujan siempre en oscuro, traen el movimiento de entrada y salida (`state="enter" | "exit"`, `animate`) y pintan el texto del público como texto plano.
- La guía de Regula (Stream · En OBS) dice que cada componente se usa como fuente de navegador con fondo transparente desde una app Astro o Next con Tailwind sobre los tokens. `ChatBox translucent` usa `color-mix` y `backdrop-filter`, con fondo sólido en un Chromium antiguo.
- Tipos de evento de Regula (`StreamEventType`): follow, sub, resub, gift, raid, bits, donation. Insignias de chat: broadcaster, mod, vip, sub, bits. Tonos: brand, sky, emerald, pink, purple, orange, indigo, neutral.
- Convenciones de la suite: Bun, Biome, Vitest y Playwright, Tailwind v4, React 19 y textos en español. Ornatus usa Astro; Scaena usa Next.js (decisión 1), que Regula soporta igual (`regula/examples/next`).
- Despliegue: Vercel (decidido). Un solo canal de Twitch y un solo canal de YouTube.
- Las reglas de regula.jotis.me mandan sobre cualquier decisión visual o de texto de este documento. Fuente local: `../regula/reference/GUIA.md` y `../regula/apps/docs/src/content/foundations/`.
- El diseño se hace antes que la interfaz, en Claude Design, como en Regula ("Regula · web de documentación") y Ornatus ("Ornatus — bienvenida y pestañas").

## Goals / Non-Goals

**Goals:**
- Una sola app Next.js que sirve la web pública, los overlays, el estudio privado y la API.
- Tiempo real sin servicios de terceros más allá de Twitch, YouTube y un Redis gestionado.
- Que una caída de Twitch o YouTube no rompa la web ni deje un overlay en blanco para siempre.

**Non-Goals:**
- Cambiar componentes de Regula. Si falta algo (por ejemplo, emotes como imagen en `ChatBox`), se propone en Regula en otro cambio.
- Panel de administración web para el contenido: el perfil se edita en el repositorio.
- Varios canales: Scaena es para un solo canal (jotis1), pero queda preparada para abrirse a más sin rehacer nada (decisión 14).
- Otras plataformas de emisión, donaciones y puntos del canal.

## Decisions

### 0. Diseño antes que interfaz

Antes de programar ninguna pantalla se hace el diseño en un artefacto de Claude Design con el sistema de diseño Jotis.me. Claude prepara el prompt al empezar esa fase y el usuario lo lanza e itera. El diseño cubre:

- Web: portada (offline y en directo), vídeos (con contenido, vacío y error), cabecera y pie, claro y oscuro, móvil y escritorio.
- Estudio: lista de overlays con vista previa y opciones, recursos (paneles y banner) y conexión con Twitch (sin conectar, conectado, revocado).
- Overlays montados a 1920×1080: las cuatro escenas con el contenido real del perfil y una escena de juego con cámara, chat, alertas, eventos, meta y estado colocados.
- Paneles del perfil de Twitch y banner con el texto real.
- Icono de app "Sc" en `lime` y favicon.
- Textos de todas las pantallas con la voz de la suite.

Dirección (decidida): nada genérico. La web, las escenas, los paneles y el banner cuentan una misma historia, la de jugar sin reloj, en lugar de rellenar una plantilla de streamer. Si el diseño pide datos nuevos para contarla (por ejemplo, horas por juego), se tratan como cambio de alcance (ver más abajo).

El enlace del diseño aprobado se apunta en este documento, en "Diseño aprobado". Las tareas de interfaz implementan ese diseño y no inventan pantallas. Si el diseño añade o quita algo que cambia las specs, se revisa el cambio con `/opsx:update` antes de seguir. La lógica sin interfaz (EventSub, IRC, YouTube, caché) no depende del aspecto, pero va después en el orden de tareas para no adelantar nada que el diseño pueda mover (por ejemplo, qué datos muestra el aviso de directo).

- *Alternativa*: diseñar sobre la marcha con los componentes. Obliga a rehacer pantallas ya programadas cuando se ve el conjunto.

**Diseño aprobado:** [Scaena en Claude Design](https://claude.ai/artifact/EFkjaMXCtS4oeMmatHWtRV), versión `1793822580-d5c5` (4 nov 2026; en ella el separador de las etiquetas es el guion, «Cyberpunk 2077 - #1», decidido), con el sistema Jotis.me. Manda sobre cualquier pantalla de este documento, con dos excepciones que se corrigen al implementar: las escenas montadas llevan `token` en la URL, y los colores puestos a mano en el lienzo (fondo del reproductor, etiqueta de duración, cuadros de transparencia de las vistas previas, pestañas del favicon) se cambian por tokens (`bg-alpha-black/…`, `bg-primary`…). Los tamaños de titular fluidos del lienzo (`clamp`) se implementan con los tamaños `display-*` de la guía por punto de corte.

### 1. Next.js 16 en Vercel, con Bun y Biome (decidido)

- **Next.js 16 con App Router**, como `regula/examples/next`. La instalación es la que documenta Regula para Next: `bun add @jotis-me/react`, Tailwind v4 con `@tailwindcss/postcss` y, en `app/globals.css`, `@import "tailwindcss"; @import "@jotis-me/react/styles.css";`, que trae los tokens y las fuentes.
- **Componentes:** los de servidor por defecto (portada, escenas, paneles); los interactivos de Regula ya llevan `"use client"` y se importan sin envolver. Lo que necesita estado (chat, alertas, eventos, meta, estado, aviso de directo, estudio) va en componentes de cliente propios.
- **Rutas y API:** route handlers en `app/api/**`. El SSE se sirve con una `Response` en streaming en el runtime de Node, y las páginas de YouTube con `revalidate`.
- **Protección de rutas** en `proxy.ts`, el antiguo `middleware.ts` de Next.
- **Bun para todo:** `bun install`, `bun run dev`, `bunx`, `bun.lock` y Bun como gestor de instalación en Vercel. **Biome** para formato y lint, sin ESLint ni Prettier (`next lint` desactivado).
- *Alternativa*: Astro, como Ornatus. Encaja con webs casi estáticas, pero Scaena es sobre todo app (overlays, estudio, API, sesión) y crecerá hacia varios canales. En Astro el estudio acabaría siendo una app de React envuelta en islas.

### 1b. Autenticación con better-auth, Prisma y Neon (decidido)

- **better-auth** con el proveedor social `twitch` y los permisos `moderator:read:followers`, `channel:read:subscriptions` y `bits:read`. Va montado en `app/api/auth/[...all]/route.ts`.
- **Base de datos:** Neon Postgres, desde el Marketplace de Vercel, con **Prisma 7** (`prismaAdapter`, cliente sin motor en Rust y `@prisma/adapter-neon` para las funciones). Las tablas de better-auth (`user`, `session`, `account`, `verification`) las genera su CLI en `prisma/schema.prisma`, y las migraciones van con `bunx prisma migrate`.
- **Solo entran las cuentas permitidas.** Un hook de base de datos de better-auth, al crear la cuenta, rechaza cualquier id de Twitch que no esté en `STUDIO_ALLOWED_TWITCH_IDS`. Así no se crea usuario ni sesión. Se verifica con un test al implementar.
- **Tokens de Twitch del usuario:** better-auth los guarda en `account`. Scaena no los usa para los eventos, que van con el token de app, pero quedan para cuando haga falta.
- **Redis sigue** para eventos, cachés, el token de overlay y los ajustes del canal. No se mueve a Postgres en este cambio.
- *Alternativas*:
  - better-auth sin base de datos, con la sesión en cookie: su revocación es incómoda y limitar quién entra está poco documentado.
  - Drizzle: algo más ligero, pero el usuario prefiere Prisma y aquí no se nota.

### 2. Chat: conexión directa del navegador al chat de Twitch

El overlay de chat abre un WebSocket a `wss://irc-ws.chat.twitch.tv` como usuario anónimo (`justinfan<n>`), pide las capacidades `twitch.tv/tags` y `twitch.tv/commands` y se une al canal. De las etiquetas salen insignias (`badges`), `id` del mensaje y `user-id`; `CLEARMSG`, `CLEARCHAT` (con y sin usuario) cubren borrados, baneos y limpieza. El tono se elige con un hash estable del `user-id` sobre la lista de tonos de Regula. Reconexión con espera creciente (1, 2, 4… hasta 15 s) y respuesta a `PING`.

- *Alternativa*: EventSub `channel.chat.message` por el servidor. Pide otro permiso, añade un salto y latencia, y no aporta nada para un chat de solo lectura.

### 3. Eventos: EventSub por webhook → Redis Stream

`POST /api/twitch/eventsub` (función de Node):
1. Verifica `Twitch-Eventsub-Message-Signature` = HMAC-SHA256 del secreto sobre `message-id + timestamp + cuerpo crudo`, en tiempo constante, y rechaza marcas de tiempo de más de 10 min.
2. Responde al reto (`webhook_callback_verification`) y registra revocaciones en Redis.
3. Elimina duplicados con `SET eventsub:<message-id> NX EX 600`.
4. Normaliza al tipo de Regula y lo añade con `XADD channel:<id>:events` (retención de 24 h por `MINID`).

Suscripciones: `channel.follow` v2, `channel.subscribe`, `channel.subscription.message`, `channel.subscription.gift`, `channel.cheer`, `channel.raid` (como destino), `stream.online` y `stream.offline`. Se ignoran los `channel.subscribe` con `is_gift = true`, porque el regalo ya llega como `channel.subscription.gift` y si no se contaría dos veces.

Conexión: la autorización de la app es la propia entrada al estudio (decisión 9), que pide los permisos `moderator:read:followers`, `channel:read:subscriptions` y `bits:read`. En `/studio/connection` se ve el estado de las suscripciones y se dan de alta o se borran. better-auth guarda el token de usuario en `account`, pero los webhooks se dan de alta con el token de app (client credentials, en Redis hasta que caduca) una vez que el dueño ha autorizado la app. El alta compara con `GET /eventsub/subscriptions` para no duplicar.

- *Alternativa*: EventSub por WebSocket desde el navegador. Obliga a poner un token de usuario en la URL de OBS y a abrir una conexión por overlay. Descartado.

### 4. Entrega a los overlays: Server-Sent Events con reanudación

`GET /api/events?channel=<channel>&token=<token>` abre un flujo SSE. La función lee `channel:<id>:events` desde el último id (`XRANGE` cada segundo; el REST de Upstash no tiene lecturas bloqueantes) y manda cada evento con `id:` igual al id del stream. Cierra la conexión sola antes del límite de duración de la función (unos 4 min) y `EventSource` vuelve a conectar con `Last-Event-ID`, así que no se pierde nada ni se repite. Al conectar sin `Last-Event-ID` se manda solo lo de los últimos 10 min (spec de recuperación). Latido de comentario cada 15 s.

- *Alternativa*: Ably o Pusher. Más fino, pero es otro proveedor y otra cuenta. Se queda como plan B si la factura de funciones en Vercel crece.
- *Alternativa*: sondeo cada 2 s. Más invocaciones y más latencia.

### 5. Alertas, eventos y metas en el cliente

- Alertas: cola en memoria; cada alerta pasa por `enter` → espera `duration` (7 s por defecto) → `exit` (200 ms) → la siguiente.
- Eventos recientes: lista que crece por arriba, con el `id` del evento como clave estable para que solo entre la fila nueva.
- Meta: parámetros `type` (`subs`, `follows`, `bits`), `label` (texto de la meta), `start`, `goal`, `unit` y `since` (marca de tiempo que pone el estudio al copiar la URL). Al conectar reproduce desde `since` (dentro de la retención de 24 h), así que recargar la fuente no pierde la cuenta. Las subs regaladas suman su cantidad. Las alertas de prueba del estudio no suman nunca (decidido): probar no mueve la meta real.

### 6. Estado del directo

`lib/twitch/estado` llama a Helix `GET /streams?user_login=<canal>` con el token de app y guarda el resultado en Redis 60 s, junto a una copia del último estado bueno sin caducidad. `stream.online` y `stream.offline` borran la caché. `GET /api/status` lo sirve con `Cache-Control: s-maxage=30`. La web y el overlay de estado lo consultan cada 30 s; el tiempo en emisión se calcula en el cliente a partir del inicio. `/live` es una ruta de servidor que redirige con 302 y sin caché.

### 7. YouTube

Se usa el canal entero (decidido): `channels.list?forHandle=@jotis_1` da la lista de subidas (`contentDetails.relatedPlaylists.uploads`), que se guarda en caché sin caducidad. Después, `playlistItems.list` de esa lista más `videos.list` (`status`, `contentDetails`, `liveStreamingDetails`) para filtrar privados, ocultos, eliminados y estrenos pendientes y sacar la duración. Lista completa en Redis con frescura de 1 h y copia sin caducidad para servir si YouTube falla. Las páginas de vídeos se sirven con `s-maxage=3600, stale-while-revalidate`. Reproductor de clic para cargar: miniatura y botón; al pulsar se inserta el `iframe` de `youtube-nocookie.com`.

Tipo y juego, del título (decidido). `lib/youtube/title` aplica `^(.+) - (.+) #(\d+)$`. El primer grupo es codicioso, así que el último " - " separa el título del juego. Si encaja, el vídeo es `live` ("Directo resubido") con `juego` y `numero`. Si no, es `edited` ("Editado") con el título tal cual. El filtro `type` y la paginación se aplican sobre la lista ya clasificada, que está entera en caché, así que la paginación es por número de página aunque la interfaz muestre "Más recientes" y "Anteriores".

### 8. Perfil del canal

`content/channel.yaml`, leído y validado con Zod por `lib/profile` (`schema.ts`). Contiene:
- `name` ("Jotis") y `twitch.login`;
- `youtube.handle` (`@jotis_1`);
- `tagline` y `description` (dos párrafos);
- `playSettings[]` ("Ajustes de partida": título y texto);
- `schedule` (`start` y `end` `HH:mm`, `days[]` opcional con `monday`…`sunday`, y `zone`, "Hora peninsular"). Las formas que pide el diseño ("Normalmente 17:00 – 20:00", "Suele ser 17-20 h", "Sin fijar", el pie de las escenas) salen de `lib/profile/schedule.ts`, no se escriben en el perfil;
- `streams[]` (Juegos, Just Chatting) y `banner.eyebrow`;
- `socials[]` (`network`, `text` y `url` opcional; Discord queda sin enlace hasta tener la invitación);
- `rules[]` y `panels[]`. Cada panel lleva título, icono, párrafos propios o `from` (`description` o `rules`), `rows` (`schedule` o `socials`) y una acción opcional. Así ningún texto se repite;
- `scenes` (`badge`, `title` y `subtitle` de cada una);
- `alerts` (frase por defecto de cada tipo, con los huecos válidos, que sí van en castellano porque se escriben en el estudio);
- `camera.name` ("Jotis");
- `chat.hidden[]`.

Los textos son los del diseño aprobado. El esquema rechaza los emojis, los iconos que no están en Regula y los titulares de más de 24 caracteres. El horario del banner siempre tiene dos filas, así que nunca supera las cuatro que admite. `bun run build` ejecuta antes `bun run validate-profile`, así que la construcción falla con el campo en el mensaje. El id de usuario de Twitch se resuelve en tiempo de ejecución a partir del login y se guarda en caché.

### 9. Estudio privado y tokens

- **Entrar con Twitch** con better-auth (decisión 1b).
  - `/studio/login` llama a `signIn.social({ provider: "twitch" })`.
  - El callback es el de better-auth (`/api/auth/callback/twitch`), que guarda `state` y PKCE.
  - Solo pasan los ids de `STUDIO_ALLOWED_TWITCH_IDS`.
  - La sesión dura 30 días en la cookie de better-auth (`HttpOnly`, `Secure`, `SameSite=Lax`).
  - "Salir" llama a `signOut`.
  - Una cuenta rechazada vuelve a `/studio/login?error=denied` y ve el aviso de estudio privado.
- **Protección de rutas.** `proxy.ts` mira si hay cookie de sesión y, si no, redirige `/studio/**` (salvo `/studio/login`) a `/studio/login`. Cada página y route handler del estudio comprueba la sesión de verdad con `auth.api.getSession`, y la API responde 401 sin sesión.
- **Canal del estudio.** Sale de la sesión (el id de Twitch de la cuenta), no de la URL, así que con varios canales cada persona solo ve el suyo. Para abrirlo a más canales bastaría con cambiar la lista de permitidos por el alta de canales: el resto no cambia.
- *Alternativa*: OAuth y cookie firmada a mano. Es menos código de terceros, pero hay que mantener `state`, PKCE, la renovación y la revocación.
- Los overlays de eventos llevan `?token=<token>`, el token de overlay del canal (en Redis, decisión 14; el estudio lo genera la primera vez y tiene un botón para rotarlo); `/api/events` lo compara en tiempo constante y responde 401 sin abrir el flujo. El cliente, ante un 401, no reintenta y deja la página transparente.
- `/studio/overlays` sigue el diseño aprobado:
  - el token de overlay, con "Rotar token" detrás de un `Modal` de confirmación (`POST /api/studio/token`);
  - "Alertas de prueba", seis botones que llaman a `/api/studio/test` y hacen `XADD` con `prueba: true`;
  - cada fuente de navegador con vista previa (los mismos componentes con datos de ejemplo), opciones, URL lista para copiar y el recordatorio de OBS.
- **Frases de alerta.** Se editan en la tarjeta de alertas y se guardan con `PUT /api/studio/settings` en `channel:<id>:settings` (Redis, JSON validado con Zod). Solo se admiten los huecos `{meses}`, `{cantidad}`, `{espectadores}` y `{bits}`, con un máximo de 120 caracteres. Sin frase guardada, se usa la del perfil. El overlay de alertas lee los ajustes al conectar y se entera de los cambios por el mismo flujo SSE (evento `settings`). El relleno de huecos es texto plano: la frase llega a `StreamAlert` como `detail`, que es un `string`.

### 10. Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Portada del canal |
| `/videos`, `/videos?page=n&type={all,live,edited}&v=<id>` | Vídeos del canal, con filtro y vídeo en reproducción |
| `/live` | Redirección al directo |
| `/overlay/[channel]/chat` · `alerts` · `events` · `goal` · `status` · `camera` | Piezas sueltas |
| `/overlay/[channel]/scene/{starting,brb,ending,offline}` | Escenas 1920×1080 |
| `/overlay/[channel]/scene/{game,chatting}` | Escenas montadas 1920×1080, con `token` |
| `/studio/login` | Entrada al estudio con Twitch |
| `/studio` (redirige a `/studio/overlays`), `/studio/overlays`, `/studio/assets`, `/studio/connection` | Privado (sesión de Twitch) |
| `/api/auth/[...all]` (better-auth), `/api/twitch/eventsub`, `/api/events`, `/api/status`, `/api/studio/test`, `/api/studio/settings`, `/api/studio/token` | API |

Todas las rutas, anclas y parámetros de URL van en inglés (decidido), también los de los overlays (`token`, `rows`, `translucent`, `animate`, `message`, `target`, `minutes`, `next`, `viewers`, `ratio`, `name`, `type`, `label`, `start`, `goal`, `unit`, `since`, `duration`, `chat`, `camera`, `events`, `page`, `v`). Lo que se lee en pantalla sigue en castellano.

Los overlays usan un layout propio: `html, body { background: transparent; overflow: hidden; margin: 0 }`, sin cabecera ni scripts de la web.

### 11. Paneles y banner a PNG

`/studio/assets` pinta cada `ChannelPanel` y el `ChannelBanner` desde el perfil, con la URL de cada acción al lado. El banner se ve a media escala y se exporta a `scale={1}`.

Los botones "Exportar PNG" y "Exportar todo" del diseño exportan en el navegador del estudio con `modern-screenshot`:
- espera a `document.fonts.ready` e incrusta las fuentes de Regula;
- usa `scale: 2` para los paneles y `1` para el banner, sobre un nodo fuera de pantalla a tamaño real;
- descarga `panel-<slug>.png` y `banner.png`, o un `.zip` con todos (`fflate`).

Paneles y banner no usan `backdrop-filter`, que es lo que peor se lleva con la captura por SVG. Un test de Playwright compara la exportación con una captura de Chromium del mismo nodo (tamaño exacto y diferencia de píxeles por debajo de un umbral).

- *Alternativa*: script local con Playwright, como estaba planteado. Funciona, pero no desde un botón en Vercel: las funciones no llevan Chromium. Se queda solo para el test.

### 12. Reglas de Regula que aplican

- **Tema.** En Regula `dark:` responde a la clase `dark-mode`, no a la preferencia del sistema. La web lleva en el `<head>` un script en línea que, antes de pintar, pone `dark-mode` en `<html>` según la elección guardada en `localStorage` (`theme`: `light` o `dark`) o, si no hay, según `prefers-color-scheme`, y sigue los cambios del sistema mientras no haya elección. En la cabecera, un único botón de tema (decidido): `Icon` `moon-01` en claro y `sun` en oscuro, con nombre accesible que dice a qué tema pasa ("Cambiar a oscuro" / "Cambiar a claro"); al pulsarlo cambia la clase y guarda la elección. Sin menú de tres opciones. Los overlays no lo necesitan: las piezas de Stream ya llevan su raíz en oscuro, y el layout de overlay pone `dark-mode` en `<html>` para lo que no sea pieza.
- **Color.** Solo utilidades de tokens (`bg-primary`, `text-secondary`, `border-secondary`, `bg-brand-solid`…). Nada de hex ni de paleta cruda (`bg-indigo-600`). Se comprueba en CI con un script como el `check:colors` de Regula sobre `src/`. "En directo" con el acento índigo y la palabra, nunca rojo. Como mucho dos o tres manchas de marca por pantalla.
- **Jerarquía.** Un `Button` `primary` por vista como mucho.
- **Marca.** Icono de app "Sc" en tono `lime`: no está usado ni es vecino de los de la suite (indigo, sky, emerald, orange, fuchsia), y no es `red`, `yellow` ni gris. No quedaba ningún morado: `violet` es vecino de `indigo` y `purple`, de `fuchsia`. Cabecera con `AppIcon` "Sc" y "Scaena" en Bricolage Grotesque bold `text-primary`: el mismo estilo que la guía da a "jotis.me", con el nombre de la app en su lugar (decidido, excepción a la guía). El tono del icono solo vive en el icono y el favicon; la interfaz sigue en índigo. Favicon con la variante sólida y, si se añade PWA, iconos `any` y `maskable` como en Ornatus.
- **Texto.** Voz cercana con humor seco (una broma por pantalla como mucho, ninguna en errores de conexión con Twitch ni en la autorización), castellano de España, tuteo, mayúscula solo al principio, verbos en los botones, sin emojis ni exclamaciones. Los errores dicen qué pasa y cómo arreglarlo.
- **Formatos.** Un módulo `lib/format` con `Intl` en `es-ES`: cifras `1.284`, importes `5,00 €`, fechas `29 oct 2026`, duraciones de vídeo `1:02:05`. Las cifras de reloj en Geist tabular (`tabular-nums`).
- **Movimiento.** Solo el de las piezas de Stream (250 ms de entrada, 200 ms de salida, solo fundido con menos movimiento). En la web, transiciones de 100 a 150 ms en color y nada decorativo.
- **Lienzos.** `StreamScene` y `ChannelBanner` con `scale={1}` en overlays y exportación, así no necesitan JavaScript; sin `scale`, necesitan un componente de cliente que mida el contenedor.
- **Accesibilidad.** Todo input con etiqueta visible, iconos solos con `label`, foco con `focus-ring-shadow`.
- **Idioma del código (convención de la suite, decidida).** Como en Regula:
  - en inglés: funciones, variables, tipos, ficheros, carpetas, claves del YAML, claves de Redis, rutas y parámetros;
  - en castellano: comentarios, títulos de los tests, mensajes de error para quien desarrolla y todo lo que se ve en pantalla.

### 13. Calidad

Biome; Vitest para lo puro (firma de EventSub, normalización de eventos, parseo de IRC, tonos, parámetros de overlay, esquema del perfil, filtrado de YouTube) con cargas reales de Twitch como fixtures; Playwright para las páginas (transparencia, 1920×1080, `/live`, accesibilidad con axe) contra Twitch y YouTube simulados.

### 14. Preparado para varios canales

Hoy hay un solo canal, pero nada da por hecho que solo habrá uno:

- **Datos por canal.** Todas las claves de Redis llevan el id de usuario de Twitch del canal: `channel:<id>:events`, `channel:<id>:status`, `channel:<id>:youtube`, `channel:<id>:eventsub`. Lo global (token de app, duplicados de EventSub) queda fuera de ese prefijo.
- **Perfil detrás de una función.** Todo lee el perfil con `getProfile(channel)`. Hoy devuelve el YAML del repositorio; mañana puede leer una base de datos, sin cambiar a quien lo usa.
- **El canal, en las URL de overlay y en la API.** Los overlays van en `/overlay/[channel]/<piece>` y `/api/events?channel=<channel>`, así que las URL que ya están en OBS siguen valiendo cuando haya más canales. El webhook de EventSub sabe de qué canal es cada evento por `broadcaster_user_id`.
- **Token de overlay por canal.** Se guarda en Redis por canal (hoy, uno) y no como variable de entorno global, así que rotarlo o dar uno a otro canal no toca el despliegue.
- **Web pública.** Hoy vive en `/`. Con varios canales pasaría a `/<canal>`, con `/` para presentar Scaena; no se adelanta nada de eso.

Fuera de este cambio: alta de canales, editor del perfil en la web, base de datos y privacidad. Irán en otro cambio si llega el momento.

### 15. Escenas montadas

`/overlay/[channel]/scene/game` y `/scene/chatting` son páginas de 1920×1080 que colocan las piezas en las posiciones del diseño aprobado. Cada pieza es el mismo componente de cliente que su overlay suelto, así que comparten la conexión al chat, el flujo SSE y el sondeo de estado, y no se duplica lógica.

Parámetros: `token`, y `chat`, `camera`, `events` y `goal` (`0` para quitar la pieza). La de juego admite además `translucent`, y las dos los de la meta. Sin token válido, la página no abre el flujo SSE y no pinta alertas, eventos ni meta. El chat, el estado y el marco siguen. El estudio genera las dos URL con el token del canal.

## Risks / Trade-offs

- [`modern-screenshot` puede no pintar igual que Chromium algún detalle de `ChannelPanel` o `ChannelBanner`] → El test de Playwright compara la exportación con una captura real. Si no pasa, se vuelve al script local de Playwright para exportar.

- [El diseño aprobado puede pedir algo que las specs no recogen o que Regula no tiene] → Revisar el cambio con `/opsx:update` antes de implementar; si falta un componente, proponerlo en Regula en un cambio aparte en lugar de crearlo en Scaena.

- [Funciones SSE abiertas durante todo el directo cuestan en Vercel] → Fluid compute cobra la CPU activa, y la función casi siempre espera. Medir la primera semana; si sale caro, pasar a Ably sin tocar los overlays (mismo formato de evento).
- [OBS cachea la fuente de navegador y puede quedarse con una versión vieja] → Recomendar en el estudio "Actualizar al hacer visible la escena" y servir los overlays con `Cache-Control: no-store`.
- [El chat anónimo de Twitch puede cambiar o limitarse] → Aislar el cliente IRC en un módulo con su propia interfaz; si cae, cambiar a EventSub `channel.chat.message` por el flujo SSE.
- [Mensajes del público con contenido malicioso] → Regula ya pinta texto plano; además no se usa `dangerouslySetInnerHTML` en ningún sitio y Biome lo prohíbe.
- [Cuota de YouTube] → Una consulta por hora como mucho y copia de respaldo; con unos 30 vídeos son unas pocas unidades de cuota al día.
- [`@jotis-me/react` 0.2.0 podría no estar en npm cuando se empiece] → Comprobarlo en la primera tarea; si no está, usar los `.tgz` de `regula/.pack` o `link:` hasta que se publique.
- [El token de overlay va en la URL de OBS y podría filtrarse en una captura] → Solo da acceso a eventos que ya son públicos en el directo; se rota desde el estudio y las URL viejas dejan de funcionar al momento.

## Migration Plan

Proyecto nuevo, sin migración. Despliegue:
1. Crear la app en la consola de desarrolladores de Twitch con la redirección `https://scaena.jotis.me/api/auth/callback/twitch` (y `http://localhost:3000/api/auth/callback/twitch` para desarrollo).
2. Crear desde el Marketplace de Vercel el Redis de Upstash y la base de datos de Neon, aplicar las migraciones (`bunx prisma migrate deploy`) y crear la clave de YouTube Data API v3.
3. Configurar las variables en Vercel: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_EVENTSUB_SECRET`, `YOUTUBE_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL` (Neon) y `STUDIO_ALLOWED_TWITCH_IDS` (hoy, el id de jotis1).
4. Desplegar, apuntar `scaena.jotis.me`, entrar con Twitch en `/studio/login` y dar de alta EventSub en `/studio/connection`.
5. Añadir las fuentes en OBS desde `/studio` y probar cada tipo de evento.

Marcha atrás: volver a la versión anterior en Vercel; las suscripciones de EventSub se pueden borrar desde `/studio/connection`.