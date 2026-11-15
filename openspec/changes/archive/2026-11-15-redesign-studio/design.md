# Design

## Context

- **Fuente del diseño**: el canvas «Scaena - Studio» (artefacto `4f8b41ee…`), con las pantallas `Main` (Overlays), `OverlaysMeta`, `OverlaysAlertas`, `OverlaysEscenaJuego`, `OverlaysEscenaEmpezando`, `OverlaysRotarToken`, `Guia`, `Recursos`, `Conexion` (y sus estados `SinConectar` y `Error`), `Login` (y `SinAcceso`), las variantes móviles, el tema claro y `Nav`. Está hecho con el sistema de diseño Jotis.me, que es Regula: los componentes del diseño (`Tabs`, `ButtonGroup`, `Table`, `Modal`, `NumberInput`, `AppIcon`, `ProgressBar`…) existen todos en `@jotis-me/react` 0.8.1.
- **Estudio de hoy**: `app/(web)/studio/(app)/layout.tsx` pinta `StudioSidebar` y un `main` de 1180 px. `OverlaySources` monta las doce `SourceCard` en dos pestañas, con `TokenCard` y `TestAlertsCard` encima. `EventsNotice` lo pinta cada página dentro de su contenido.
- **Huecos de las frases**: hoy se validan contra la lista global `PLACEHOLDERS` (`lib/profile/schema.ts`), así que `{meses}` se admite en la frase de follow. Los overlays rellenan con `fillPhrase`, que ya deja vacío un hueco sin dato.
- **La lección de 0.0.1**: las páginas son de servidor y `Table` es de cliente. Ninguna columna puede llevar `render`; las celdas van ya pintadas en las filas.

## Goals / Non-Goals

**Goals:**
- Reproducir el diseño con componentes de Regula y tokens, sin colores propios.
- Que las vistas previas sigan saliendo de los layouts de verdad (`GameLayout`, `ChattingLayout`, `StreamScene`) y no de la maqueta del canvas, que coloca algunas piezas a ojo (el chat a 420 × 520, los eventos a 360).

**Non-Goals:**
- Cambiar los overlays, sus URL o la API.
- Poner «Estudio» en la cabecera de la web pública. Eso obligaría a leer la sesión en páginas que hoy se cachean, y el diseño solo lo enseña dentro del estudio.
- Rehacer las alertas de eventos según el estado. El diseño solo dibuja el caso «sin conectar»; los textos por estado de `eventsNotice` se quedan como están (ver Decisión 3).

## Decisions

### 1. El armazón: la cabecera de la web y una barra de secciones

`SiteHeader` acepta `studio?: { name: string }`. Con él, añade «Estudio» (actual, con sus cuatro secciones como `children` para el menú móvil) a «Inicio» y «Vídeos»; sin él, la web sigue igual. Debajo, `StudioSections` (cliente, por `usePathname`): `Tabs type="underline"` con `href` en cada pestaña, que Regula pinta como una `<nav>` de enlaces con `aria-current="page"`, y a la derecha `Avatar`, el nombre y «Salir» (el `authClient.signOut` de `StudioSidebar`). Con `flex-wrap: wrap-reverse` como en el canvas, en móvil la cuenta queda arriba y las pestañas se desplazan dentro de su caja. `StudioSidebar` se borra. El contenido pasa a un `StudioContent` de 1280 px como máximo (`max-w-320`) con el relleno del canvas (`min(32px, 4.2%)`).

- *Alternativa*: mantener la barra lateral y solo restilizar. Se rechaza porque el diseño la quita.

### 2. Overlays: un registro de fuentes y un detalle

`components/studio/overlays/sources.tsx` define cada fuente una sola vez: `id`, tipo (pieza o escena), título, tamaño, descripción, nota del token, título de las opciones y dos funciones de pintar, la vista previa y las opciones. `OverlaySources` queda en lista y detalle:

- **Lista**: `Tabs type="button-border" fullWidth` para «Piezas» / «Escenas» y `Tabs orientation="vertical" type="button-gray"` con las seis fuentes del tipo.
- **Detalle**: cabecera con título, `Badge` del tamaño y, en escenas, `ButtonGroup` del lienzo. Debajo, el escenario: `TransparencyGrid` con la vista previa, cuya escala sale del ancho medido con un `ResizeObserver`, como en el canvas. Después, la URL con «Copiar» y la nota; en escenas, «Cómo montarla en OBS». Al final, las opciones.
- **URL de la página**: la elección va en `?source=<id>&canvas=`, con `router.replace` sin desplazar. `?tab=scenes` sin `source` se traduce a `game`, y un `source` desconocido, a `chat`.

`SourceCard` desaparece. El estado de las opciones, el copiado con `since` fresco y `maskToken` pasan intactos al detalle.

### 3. El aviso de eventos va en una franja propia

El layout no sabe en qué página está, y el aviso solo va en Overlays, Guía y Recursos. Por eso cada una de esas páginas pinta primero `<EventsNotice>` (sin cambios de lógica, todavía dentro de `Suspense`) como una franja a todo el ancho con borde inferior, y después su `StudioContent`. Conexión no la pinta. Los textos siguen siendo los de `eventsNotice` por estado, que son más precisos que el genérico del canvas.

### 4. Token y alertas de prueba, dentro del detalle

- **Token**: `TokenField` es un `Input` de solo lectura con `maskToken` y `trailingButton` «Rotar». Abre el `Modal` de confirmación (`color="warning"`, «Cancelar» / «Rotar token» destructivo) con la misma llamada a `/api/studio/token` que `TokenCard`.
- **Pruebas y frases**: `PhraseEditor` pasa a tener una fila por tipo, con un botón secundario de prueba (`/api/studio/test`, etiquetas del canvas: «Follow», «Sub», «Renovación de 14 meses», «5 subs regaladas», «Raid de 1.284», «500 bits») y el campo de su frase. La pista dice «Se rellena solo: {…}. Ahora dice: …». La vista previa de «Alertas» enseña el tipo que se probó o editó por última vez. «Guardar frases» pasa a primario y se desactiva mientras haya algún error. `TestAlertsCard` se borra.

### 5. Huecos por tipo, una sola regla para cliente y servidor

`lib/alerts/phrase.ts` exporta `PHRASE_HOLES: Record<AlertType, Placeholder[]>` y `phraseError(type, text): string | null`. Esa función la usan el editor mientras se escribe y `saveSettings` al guardar: el esquema de guardado añade un `superRefine` por tipo. `readSettings` y el perfil siguen con el esquema global, para que una frase guardada antes no tumbe todos los ajustes del canal (la lectura entera cae a `{}` si algo no valida). El perfil del canal se comprueba con un test: sus seis frases cumplen la regla por tipo.

- *Alternativa*: endurecer también la lectura. Se rechaza porque una frase vieja borraría en silencio todas las frases guardadas.

### 6. Meta: textos y unidad del canvas

`GOAL_LABELS` pasa a «Meta de subs», «Meta de seguidores» y «Meta de bits». Se añade `GOAL_UNITS` («subs», «seguidores», «bits»). `LiveGoal`, la vista previa y la meta por defecto usan `unit ?? GOAL_UNITS[type]`. El editor deja «Objetivo» y «Llevas» como `NumberInput` (mínimos 1 y 0) y el botón pasa a primario. Las URL antiguas sin `label` enseñan el texto nuevo, cosa que no tiene importancia.

### 7. Guía: componentes de servidor, el esquema a partir de las cajas

- **Lienzo**: `GuideCanvasPicker` pasa de `Select` a `ButtonGroup` («Tu lienzo en OBS»).
- **Índice**: `Tabs type="button-gray" size="sm"` con `href="#game"`, que se pinta como enlaces.
- **Esquema**: `GuideDiagram` es de servidor y saca los porcentajes de `boxes.ts`, igual que la tabla: la cámara en `gameCamera(width)` o `CAMERA_HOLE` sobre `width × 1080`, y el lienzo con `aspect-ratio` 16/9 o 43/18. El canvas trae porcentajes escritos a mano y ya no cuadran con las medidas reales.
- **Números**: con `formatNumber` («1.488, 816»).
- **Máscara**: la muestra va sobre `TransparencyGrid`. El blanco de la muestra lleva `color-fijo`, porque dibuja la máscara, no la interfaz.
- **Ajustes de la fuente de navegador**: cuatro tarjetas en una rejilla `auto-fit`.

### 8. Recursos, Conexión y Acceso

- **Recursos**: «Descargar todo (.zip)» sube a la cabecera; la descarga ya existe en `ProfileAssets`. Cada panel es un `article` con su vista previa, el nombre del fichero y «Descargar».
- **Conexión**:
  - Una tarjeta de cuenta con `ProgressBar` «Suscripciones activas: N de 8».
  - La tabla gana «Alimenta», que sale de un mapa por tipo de suscripción en `lib/studio/connection.ts`; las celdas, otra vez sin `render`.
  - Sin conectar: `EmptyState` y la tarjeta «Permisos que se piden», con una frase por permiso.
  - Si Twitch falla: el `Alert` con «Volver a intentar», que hace `router.refresh()` desde un pequeño botón de cliente.
- **Acceso**: tarjeta de 440 px sobre `bg-secondary`, con `AppIcon app="scaena"` y el `Alert` de cuenta sin acceso dentro de la tarjeta.

## Risks / Trade-offs

- [Rehacer Overlays rompe muchas e2e que buscan tarjetas (`article` por nombre)] → Se reescriben en la misma tarea que cada parte. Los nombres accesibles se mantienen donde se puede: «URL para OBS», «Copiar», «Guardar meta» y «Rotar token».
- [Medir el escenario con `ResizeObserver` hace que la escala cambie después del primer pintado] → El primer pintado usa un ancho por defecto de 962 px (el del canvas a 1440) y la vista previa es decorativa (`aria-hidden`).
- [Una frase vieja con un hueco de otro tipo] → Se sigue leyendo y usando, y el estudio la marca. Escenario «Frase guardada antes del cambio».

## Migration Plan

No hay datos que migrar. Se puede volver atrás revirtiendo: las URL de OBS, la API y lo guardado no cambian.
