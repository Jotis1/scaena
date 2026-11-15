# Proposal

## Why

Al usar el estudio 0.2.0 en un directo han salido varios problemas:

- **Navegación:** hay dos barras de navegación, una encima de la otra, que chocan entre sí. Además, el estudio no tiene entrada desde la web.
- **Overlays:**
  - El selector de lienzo se ve sin relleno a la izquierda.
  - Las URL salen en fuente mono y con el origen repetido.
  - En los campos con el token se pueden seleccionar y copiar los puntos que lo tapan, y quien copie así cree que se lleva el token.
  - Para cambiar la meta de una escena hay que ir a la pieza suelta.
- **Meta:** Twitch ya lleva las metas del canal y Scaena se inventa una aparte.
- **Guía:** la «Guía de OBS» tarda tanto en cambiar de lienzo que parece que el botón no funciona. Tampoco explica cómo funciona Scaena ni qué hay que hacer a mano.
- **Recursos:** los paneles y el banner llevan fijas las redes, las normas y el horario del repositorio, así que no se pueden cambiar sin desplegar.

## What Changes

- **Navegación del estudio:**
  - Queda una sola cabecera, la de la web, con «Estudio» como página actual.
  - Las secciones pasan a una barra lateral (`SidebarNav` de Regula), que en el móvil se abre como menú.
  - Se quita la barra de secciones de debajo de la cabecera. **BREAKING** para la spec «Navegación del estudio», que prohibía la barra lateral.
- **Estudio visible en la web:**
  - La cabecera pública enseña «Estudio» a todo el mundo. Sin sesión lleva a `/studio/login`.
  - Solo puede entrar la cuenta autorizada, como hasta ahora.
  - Con sesión, a la derecha de la cabecera sale el avatar de la cuenta con un desplegable de cuenta de Regula. Lleva el tema (Claro, Oscuro, Sistema) y «Cerrar sesión», y sustituye al selector de tema suelto.
- **Overlays:**
  - Se arregla el relleno del selector de lienzo.
  - La URL va con el origen como prefijo del campo (`https://scaena.jotis.me`) y el resto en la fuente normal.
- **Token nunca seleccionable:** todo campo que enseñe el token, tapado o dentro de una URL, va deshabilitado. Copiar y rotar pasan a botones fuera del campo.
- **Escenas configurables pieza a pieza:**
  - El detalle de las escenas de juego y Just Chatting tiene un bloque por pieza (estado, alertas, chat, eventos, meta y cámara), con su interruptor y las mismas opciones que la pieza suelta.
  - Desde ahí se editan la meta y las frases.
  - La URL de la escena lleva esas opciones.
- **Meta de Twitch:**
  - Scaena lee las metas del creador de Twitch con «Get Creator Goals» y los eventos `channel.goal.begin`, `channel.goal.progress` y `channel.goal.end`.
  - Si hay una meta activa en Twitch, la pieza y las escenas enseñan esa, con su texto, objetivo y progreso.
  - Si no hay ninguna, sale la meta guardada en Scaena, que se sigue editando en el estudio.
  - Pide el permiso nuevo `channel:read:goals`. Hay que volver a entrar con Twitch y reconectar los eventos.
- **Guía de uso:**
  - «Guía de OBS» pasa a llamarse «Guía de uso».
  - Suma estas secciones:
    - «Cómo funciona»: de Twitch a Scaena y de Scaena a OBS, el token y qué va solo.
    - «Lo que hay que hacer a mano»: conectar eventos, ajustar el lienzo en OBS, pegar las URL, aplicar la máscara y crear la meta en Twitch.
    - «Trucos de OBS»: por ejemplo, cámara con filtro en una escena y sin él en otra. Se hace con una escena con la cámara, metida en un grupo, y el filtro va en el grupo y no en la fuente, porque en la fuente cambiaría todas las escenas.
  - Cambiar de lienzo es instantáneo, sin pasar por el servidor.
- **Perfil editable:**
  - Desde «Recursos» se editan el lema, la descripción, el horario, las redes, las normas, los paneles y la línea del banner.
  - Se guarda por canal en la base de datos, encima de `content/channel.yaml`, que queda como valores por defecto.
  - Lo guardado lo usan los paneles, el banner, la web pública y las escenas. **BREAKING** para «Contenido del canal en un solo sitio», que exigía un perfil versionado en el repositorio.
- Versión 0.3.0 (feature → minor).

## Capabilities

### New Capabilities
- Ninguna. La cuenta en la cabecera queda dentro de `channel-site`.

### Modified Capabilities
- `channel-site`: la cabecera pública enseña «Estudio» y, con sesión, el desplegable de cuenta en lugar del selector de tema suelto. «Navegación del estudio» pasa a barra lateral.
- `obs-overlays`:
  - Overlays: URL con prefijo y sin mono, campos del token deshabilitados, relleno del selector de lienzo y opciones por pieza en las escenas.
  - «Guía de montaje en OBS» pasa a «Guía de uso», con más secciones y cambio de lienzo instantáneo.
  - La meta de Twitch manda sobre la guardada.
- `twitch-events`: el permiso `channel:read:goals`, las suscripciones `channel.goal.*` y el seguimiento de la meta activa de Twitch.
- `twitch-profile-assets`: los paneles y el banner salen del perfil editado, y la página de recursos deja editarlo.
- `channel-profile`: el contenido sale de `content/channel.yaml` con los cambios guardados en el estudio encima, validados igual.

## Impact

- **Código:**
  - `components/web/SiteHeader.tsx`, `ThemeMenu.tsx`, y un nuevo `AccountMenu`.
  - `app/(web)/studio/(app)/layout.tsx`, `StudioSections` (pasa a barra lateral) y `lib/studio/pages.ts`.
  - `components/studio/OverlaySources.tsx`, `TokenField.tsx`, `lib/studio/overlay-urls.ts`, `components/overlay/scenes/params.ts`, `GameScene` y `ChattingScene`.
  - Guía: `app/(web)/studio/(app)/guide/page.tsx`, `GuideCanvasPicker` (estado de cliente) y `lib/studio/obs-guide.ts`.
  - Meta: `lib/alerts/saved-goal.ts`, un nuevo `lib/alerts/twitch-goal.ts`, `lib/events/initial.ts` y `LiveGoal`.
  - EventSub: `lib/twitch/eventsub/normalize.ts`, `subscriptions.ts`, `webhook.ts`, `lib/auth.ts` (scope) y `lib/studio/connection.ts`.
  - Perfil: `lib/profile/index.ts`, que pasa a ser asíncrono con los cambios guardados, sus 33 usos, `lib/studio/panels.ts`, la página de Recursos y un nuevo editor del perfil.
- **Base de datos:** modelo Prisma nuevo `ChannelProfile`, con su migración.
- **API:**
  - `PUT /api/studio/profile`.
  - El evento SSE `goal` lleva también el origen (`twitch` | `scaena`).
- **Twitch:** el scope nuevo obliga a volver a entrar y a pulsar «Conectar eventos», que da de alta las tres suscripciones de meta.
- **Pruebas:**
  - Unitarias de la meta de Twitch, las URL de escena, la fusión del perfil y la cabecera.
  - e2e de la barra lateral, el desplegable de cuenta, los campos deshabilitados, la guía y el editor de recursos.
