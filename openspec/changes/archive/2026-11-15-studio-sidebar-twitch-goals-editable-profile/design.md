# Design

## Context

El estudio 0.2.0 (cambio `redesign-studio`) tiene esta navegación:

- La cabecera de la web, con «Estudio» y sus secciones como hijos.
- Debajo, otra barra horizontal (`StudioSections`) con pestañas, la cuenta y «Salir».

Para el resto del estudio, esto es lo que hay ahora:

- **Overlays:** la URL sale en un `Input` de solo lectura con `font-mono` y «Copiar» como `trailingButton`. El token se ve tapado con puntos, pero se puede seleccionar.
- **Escenas:** solo tienen interruptores (cámara, eventos, meta y chat translúcido). La meta y las frases solo se editan en sus piezas sueltas.
- **Meta:** es la de Scaena (`lib/alerts/saved-goal.ts`). La cuenta lleva su propio contador en Redis y se emite como evento SSE `goal`.
- **Guía:** cambiar de lienzo hace `router.replace` en una página `force-dynamic`. Eso vuelve a pedir al servidor la sesión (base de datos) y el aviso de eventos (Helix), y hasta que contesta el botón no cambia.
- **Perfil:** sale de `content/channel.yaml` con `getProfile`/`getMainProfile`, que son síncronos, con caché en memoria y 33 usos. Todas las páginas que lo usan ya son dinámicas.

Para construirlo, Regula 0.8.1 trae estos componentes:

- `SidebarNav`, con `responsive` (se recoge en un menú con botón).
- `Dropdown`, con la variante `account-avatar`, `header` y `heading` y opciones con `selectedValue`.
- `Input` con `prefix`. Ojo: con `disabled`, el `Input` también deshabilita su `trailingButton`.

## Goals / Non-Goals

**Goals**

- Una sola barra horizontal (la cabecera) y las secciones del estudio en una barra lateral.
- «Estudio» en la cabecera pública y el desplegable de cuenta con el tema y «Cerrar sesión».
- Que ningún campo deje seleccionar el token.
- URL con el origen de prefijo y en la fuente normal.
- Opciones de cada pieza dentro de las escenas.
- Meta de Twitch con prioridad sobre la de Scaena.
- «Guía de uso» con «Cómo funciona», «Lo que hay que hacer a mano» y «Trucos de OBS», y cambio de lienzo instantáneo.
- Perfil editable desde Recursos, que vale para toda la app.

**Non-Goals**

- Abrir el estudio a otras cuentas. Sigue `STUDIO_ALLOWED_TWITCH_IDS`.
- Mover o redimensionar piezas dentro de las escenas.
- Crear o editar metas de Twitch desde Scaena. Twitch no lo permite por API.
- Editar desde el estudio la identidad (usuario de Twitch, handle de YouTube), los textos de la portada, las escenas de pantalla completa ni las frases por defecto. Las frases ya tienen su editor.
- Que las escenas abiertas en OBS se enteren en vivo de los cambios del perfil. Los toman al recargar la fuente.

## Decisions

### 1. Armazón del estudio: cabecera de la web y `SidebarNav`

- `SiteHeader` deja de recibir `studio` con hijos. Solo marca «Estudio» como actual cuando la ruta empieza por `/studio`.
- El layout del estudio pasa a ser una rejilla: `SiteHeader` arriba y, debajo, `SidebarNav type="simple" responsive` a la izquierda con `STUDIO_PAGES`. Cada página lleva un icono de Untitled UI: `LayersThree01`, `BookOpen01`, `Image01` y `Link03`. A la derecha va `<main>`.
- `StudioSections` se sustituye por `StudioSidebar`, que no pasa `account`, `user` ni `onLogout`: la cuenta vive en la cabecera.
- La franja de aviso (`EventsBand`) queda dentro de `<main>`, encima del contenido y al lado de la barra lateral.
- En `STUDIO_PAGES`, «Guía de OBS» pasa a «Guía de uso». La ruta sigue en `/studio/guide`: las URL van en inglés y así no se rompen los enlaces de 0.2.0.
- *Alternativa descartada:* las secciones en el menú «Estudio» de la cabecera, sin barra lateral. Esconde la navegación dentro de un desplegable, y el usuario pidió barra lateral.

### 2. Sesión en la cabecera y `AccountMenu`

- Los layouts `(site)` y `(app)` del estudio, que son de servidor, leen la sesión con `readSession(await headers())` y pasan a `SiteHeader` un `account?: { name; image? }`.
  - La web ya es dinámica, así que leer la sesión solo añade una consulta cuando hay cookie.
  - `readSession` devuelve `null` enseguida si no hay cookie de sesión: se comprueba con `getSessionCookie` de better-auth antes de ir a la base de datos.
- «Estudio» se enseña siempre. Su `href` es `/studio/overlays` con sesión y `/studio/login` sin ella.
- A la derecha de la cabecera:
  - Sin sesión, `ThemeMenu`, como ahora.
  - Con sesión, `AccountMenu`: un `Dropdown variant="account-avatar"` con estas piezas:
    - En la cabecera, un `AvatarLabel` con el nombre y «Cuenta de Twitch».
    - `heading: "Tema"` con las tres opciones, marcadas con `selectedValue`.
    - Un divisor y «Cerrar sesión» con `LogOut01`.
- La lógica del tema sale de `ThemeMenu` a un hook `useTheme()` que comparten los dos menús, con el mismo evento `scaena:theme`.
- Cerrar sesión hace `authClient.signOut()`, después `router.replace("/")` y `router.refresh()`.
- `HeaderNav` pinta las acciones dos veces (`mobileActions`), así que `AccountMenu` no usa `id` fijos.

### 3. Campos con el token deshabilitados y URL con prefijo

- `SourceUrl`:
  - Va con `<Input disabled prefix={origin} value={maskToken(pathAndQuery)} />`, sin `font-mono`. `sourceUrl` ya lo construye todo, así que se parte en `origin` y el resto.
  - «Copiar»/«Copiada» pasa a un `Button hierarchy="secondary" size="md"` al lado, con `aria-describedby` hacia el campo. Va fuera porque el `trailingButton` de un `Input` deshabilitado también se deshabilita.
  - En el móvil, el botón baja debajo del campo (`flex-wrap`).
- `TokenField` hace lo mismo: el `Input` va deshabilitado y «Rotar» es un `Button` al lado.
- El origen es el de la petición (`p.origin`), que en producción es `https://scaena.jotis.me`. En local sale `http://localhost:3000`, que también es la URL que vale.
- Una prueba de componente recorre Overlays y comprueba que todo `input` cuyo valor contenga `•` está `disabled`.

### 4. Relleno del selector de lienzo

Causa, confirmada con capturas: el `ButtonGroup` de Regula 0.8.1 dibuja su marco con una sombra *interior* del `fieldset`, y el fondo opaco de los botones (`bg-primary`) la tapa. El grupo se queda sin borde y el botón elegido parece pegado al texto de la izquierda, sobre todo en oscuro. En Scaena se rodea con una sombra exterior (`BUTTON_GROUP_FRAME`, en `StudioContent.tsx`) en los dos selectores de lienzo, Overlays y la guía. Hay que arreglarlo en Regula y luego quitar el rodeo.

### 5. Opciones de cada pieza dentro de las escenas

**Parámetros de las escenas.** `sceneOptions` (`components/overlay/scenes/params.ts`) acepta además los parámetros de cada pieza, con los mismos nombres y valores por defecto que la pieza suelta:

| Pieza | Parámetros |
|---|---|
| Chat | `animate` (y `translucent`, que ya estaba) |
| Alertas | `message` |
| Eventos | `rows` |
| Estado | `viewers` |
| Cámara | `name` |

`GameScene` y `ChattingScene` se los pasan a las piezas, y `sourceUrl` los emite para `scene/game` y `scene/chatting` solo cuando no son el valor por defecto.

**Interfaz.** Las opciones de cada pieza salen de `options` (`OverlaySources.tsx`) a componentes por pieza: `ChatOptions`, `AlertOptions` (con `PhraseEditor`), `EventOptions`, `GoalOptions` (con `GoalEditor` y el aviso de meta de Twitch), `StatusOptions` y `CameraOptions`.

- La pieza suelta los usa tal cual.
- Las escenas los meten en un bloque por pieza (`ScenePieceBlock`): un título y, si la pieza es opcional, su `Toggle`. Con el interruptor apagado, las opciones de la pieza se esconden.
- En Just Chatting, la cámara no tiene opciones de proporción: la fija el hueco.
- Para no hacer larguísima la página, los bloques van en un `Accordion` de Regula con «Meta» abierto por defecto.

`SourceOptions` reutiliza los campos que ya tiene (`rows`, `viewers`, `animate`, `message`, `name`). No hacen falta nombres nuevos.

### 6. Meta de Twitch

**Datos.** Una clave nueva, `channel:<id>:twitch-goal`, guarda `{ id, twitchType, description, current, target, startedAt }`. Las metas de Twitch se traducen así:

| Tipo de Twitch | Tipo en Scaena | Unidad |
|---|---|---|
| `follower` | follows | seguidores |
| `subscription` | subs | puntos de sub |
| `new_subscription` | subs | puntos de sub |
| `subscription_count` | subs | subs |
| `new_subscription_count` | subs | subs |
| `new_bit` | bits | bits |
| `new_cheerer` | bits | personas |

El texto es la `description`, o la etiqueta del tipo si viene vacía.

**Resolución.** `resolveGoal(store, channelId)` en `lib/alerts/goal-source.ts` devuelve la de Twitch si la hay y, si no, `readGoal` (la de Scaena). El `GoalState` añade `source: "twitch" | "scaena"`.

**Cuándo se publica.**

- `initialEvents` y cada publicación del evento `goal` usan `resolveGoal`.
- `saveGoal` sigue guardando la meta de Scaena, pero publica la resuelta. Mientras haya meta de Twitch, guardar la de Scaena no cambia lo que se ve en OBS.
- `countGoalEvent` sigue sumando a la cuenta de Scaena, para que esté al día cuando acabe la de Twitch. Solo publica si no hay meta de Twitch.

**EventSub.**

- `SUBSCRIPTIONS` suma `channel.goal.begin`, `channel.goal.progress` y `channel.goal.end` (versión 1, `broadcaster_user_id`): pasan de 8 a 11.
- `normalize` devuelve `{ kind: "goal", channelId, phase: "begin" | "progress" | "end", goal }`.
- El webhook, después del paso que quita duplicados, guarda la meta en begin y progress. En end, la borra solo si el `id` coincide con la guardada, y después publica `resolveGoal`.
- Twitch da cifras absolutas, así que repetir un aviso no suma dos veces.
- `SUBSCRIPTION_LABELS` y `CONSEQUENCE` añaden los textos de las tres.

**Siembra.**

- `GET /helix/goals?broadcaster_id=` necesita el token de usuario con `channel:read:goals`. Se pide con `auth().api.getAccessToken({ providerId: "twitch", userId })`, que lo renueva si hace falta.
- Se llama:
  - Al pulsar «Conectar eventos».
  - Al cargar Overlays, sin esperar a la respuesta para pintar, con 2 s de tiempo máximo.
- Si Twitch no responde, se queda la meta que hubiera.
- Si hay varias metas activas, vale la de `started_at` más reciente.
- Si Twitch dice que no hay ninguna, se borra la clave.

**Permiso.**

- `TWITCH_SCOPES` suma `channel:read:goals`, y `SCOPE_DESCRIPTIONS` lo describe.
- La página de conexión compara `Account.scope` con `TWITCH_SCOPES`. Si falta alguno, enseña una alerta con «Volver a entrar con Twitch» (`authClient.signIn.social`, que vuelve a pedir el consentimiento).

**Overlays y estudio.**

- `LiveGoal` no cambia de forma, porque recibe `GoalState` con su texto y su unidad. Las piezas no distinguen el origen.
- En el estudio, `GoalOptions` enseña un `Alert` cuando `source === "twitch"`: «Ahora sale tu meta de Twitch. Se cambia en el panel de creador de Twitch.» El editor de la meta de Scaena queda debajo, con el hint «Se usa cuando no hay meta en Twitch».

*Alternativa descartada:* sustituir del todo la meta de Scaena. El usuario eligió conservarla como respaldo.

### 7. Guía de uso con cambio de lienzo en el cliente

**Por qué tarda.** Cada `router.replace` vuelve a pedir al servidor la página entera, que es `force-dynamic`: `requirePageSession` (base de datos), el layout y el aviso de eventos (Helix). Mientras tanto, el `ButtonGroup` sigue marcando el lienzo anterior, porque su valor llega del servidor.

**Arreglo.**

- La parte de la guía que depende del lienzo (tablas de fuentes, esquemas y ajustes) pasa a un componente de cliente, `GuideBody`, con el lienzo en `useState`.
- `lib/studio/obs-guide.ts` es TypeScript puro, así que calcula las medidas en el cliente.
- La URL se actualiza con `window.history.replaceState`. Next la sincroniza con `useSearchParams` y no pide nada al servidor. El hash (`#game`) se conserva.
- La página de servidor solo lee el `?canvas=` inicial.
- El selector de lienzo de Overlays cambia `router.replace` por `history.replaceState` por lo mismo.

**Secciones nuevas.** Contenido estático en JSX, con los componentes ya existentes de la guía (`GuideSection`, `Alert`, listas numeradas):

1. «Cómo funciona»: Twitch avisa a Scaena con EventSub, Scaena se lo pasa a las fuentes de OBS en vivo y el token protege las URL. Lo que va solo: alertas, eventos, meta, estado y chat.
2. «Lo que hay que hacer a mano»:
   1. Entrar y conectar eventos, con enlace a Conexión.
   2. Poner el lienzo base en OBS (Ajustes › Vídeo).
   3. Añadir cada URL como fuente de navegador con su tamaño.
   4. Aplicar la máscara de la cámara.
   5. Crear la meta en el panel de creador de Twitch si se quiere usar la suya.
   6. Volver a copiar las URL después de rotar el token.
3. «Trucos de OBS»: cámara con filtro en una escena y sin él en otra.
   1. Crear una escena «Cámara» con la fuente de la cámara.
   2. En la escena donde va con filtro, añadir la escena «Cámara» como fuente y meterla en un grupo.
   3. Poner el filtro en el grupo.

   El filtro no va en la fuente de la cámara porque es la misma en todas las escenas y las cambiaría todas.

El índice de la guía suma esas tres entradas, que van antes de las escenas.

### 8. Perfil editable

**Almacenamiento.** Modelo Prisma `ChannelProfile { login String @id; data Json; updatedAt DateTime @updatedAt }`, con su migración.

- La clave es el usuario de Twitch, que no se puede editar y es lo que sabe la web pública.
- `data` guarda solo los campos editados: `tagline`, `description`, `schedule`, `socials`, `rules`, `panels` y `banner`.

**Carga.** `loadProfile(login)` y `loadMainProfile()` son asíncronas y van envueltas en `cache()` de React, así que hacen una consulta por petición.

1. Parten del YAML, que sigue validándose al construir.
2. Le ponen encima `data`.
3. Validan el resultado con `profileSchema`.
4. Si falla, quitan los campos de primer nivel con errores, avisan en el log y devuelven `invalidFields` para que el estudio lo diga.

`getProfile` y `getMainProfile` desaparecen y sus 33 usos pasan a `await`. Los que viven en componentes de cliente reciben el perfil por props, como ahora.

**API.**

- `PUT /api/studio/profile`, con `{ edits }`:
  1. Exige sesión y que el canal de la sesión sea el del perfil.
  2. Rechaza claves fuera de las editables.
  3. Fusiona y valida con `profileSchema`.
  4. Contesta 422 con `{ fields: { "rules.2": "…" } }`, usando las rutas de zod, o guarda y contesta 200 con el perfil.
- `DELETE /api/studio/profile` borra lo guardado, para volver a los valores por defecto.

**Interfaz.** En Recursos, una sección «Contenido del canal» encima de las vistas previas, con un `Accordion` de bloques:

- «Lema y descripción»: `Input` y `Textarea` por párrafo, de 1 a 4.
- «Horario»: `Input type="time"` para el inicio y el fin, `Checkbox` por día y zona.
- «Redes»: red, usuario y enlace opcional.
- «Normas»: de 1 a 5, con añadir y quitar.
- «Paneles»: título, icono (`Select` de los iconos de `lib/icons`), párrafos y acción. Los paneles que toman la descripción, las normas, el horario o las redes dicen de dónde sacan el texto en lugar de dejarlo editar.
- «Banner»: la línea de arriba.

El borrador vive en el cliente. `panelsOf` y `bannerOf` son puras, así que la vista previa se calcula con el borrador al momento. «Guardar» deshabilitado si no hay cambios. «Volver a los valores por defecto», con un `Modal` de confirmación. Los errores salen en su campo.

*Alternativa descartada:* guardarlo en Redis, en `channel:<id>:settings`, como las frases. El perfil es contenido duradero que lee toda la web y Postgres ya está, y las frases siguen donde están.

### 9. Versión

Es una feature, así que la versión pasa a 0.3.0: commit de release con la versión en `package.json` y la etiqueta anotada `v0.3.0` al mergear en `main`.

## Risks / Trade-offs

- **Hay que volver a entrar con Twitch por el permiso nuevo.** Hasta entonces, la meta de Twitch no llega y las tres suscripciones de meta fallan al darse de alta. → La página de conexión dice qué permiso falta y lleva a volver a entrar. «Conectar eventos» sigue dando de alta las otras ocho.
- **Leer la sesión en la web pública añade una consulta por visita con cookie.** → Se corta antes, sin cookie de sesión. Solo jotis_1 tiene sesión.
- **`getAccessToken` puede fallar** (refresh token caducado). → Sin siembra, la meta llega con el siguiente aviso de Twitch, y en el log queda el motivo.
- **Un perfil guardado puede dejar de valer tras un despliegue.** → Se ignoran solo los campos que fallan y el estudio lo avisa. La web nunca se cae por eso.
- **Que el perfil sea asíncrono toca 33 sitios.** → Es un cambio mecánico, con `tsc` y las pruebas actuales como red. Se hace en una tarea aparte, antes de la interfaz.
- **Con el `Accordion`, en la escena se ven menos opciones a la vez.** → «Meta» va abierto y cada bloque dice en su título si la pieza está apagada.

## Migration Plan

1. Migración Prisma `channel_profile`. `vercel-build` ya corre `prisma migrate deploy`.
2. Después del despliegue: entrar de nuevo con Twitch, que pide el permiso de metas, y pulsar «Conectar eventos» en Conexión, que da de alta las tres suscripciones de meta.
3. Las URL de OBS de 0.2.0 siguen valiendo: los parámetros nuevos de las escenas son opcionales y la ruta de la guía no cambia.
4. Vuelta atrás: revertir el despliegue. La tabla nueva y las suscripciones de meta sobrantes no molestan a 0.2.0, porque el webhook antiguo ignora los tipos que no conoce.

## Open Questions

- Ninguna que bloquee. La causa exacta del relleno del selector de lienzo se confirma en la primera tarea (decisión 4).
