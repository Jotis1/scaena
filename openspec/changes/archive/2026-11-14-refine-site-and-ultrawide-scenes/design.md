# Design

## Context

- La web usa `HeaderNav type="simple"` (`components/web/SiteHeader.tsx`), con la navegación como pastillas resaltadas y el contenido centrado en 1280 px. `HeaderNav` trae `type="underline"` y `fullWidth`.
- En móvil (por debajo de 1024 px de ancho de la cabecera), `HeaderNav` 0.8.0 solo pinta la marca y el botón de menú: **las `actions` no salen**, y hoy el botón de tema no se ve en móvil. Regula 0.8.1 añade `mobileActions`, que pinta `actions` también en la fila móvil, entre la marca y el botón de menú (las pinta dos veces en el HTML y la CSS enseña una, así que no pueden llevar `id` fijos). El panel del menú pinta `search` arriba y `mobile.footer` abajo.
- El tema lo pone `public/theme-init.js` antes de pintar: lee `localStorage.theme` (`light` o `dark`) y, sin valor, sigue `prefers-color-scheme` y escucha sus cambios. `ThemeToggle` usa `ButtonUtility` y cambia de icono (luna o sol). En el estudio va en las acciones de `PageHeader`.
- Regula 0.8 trae `Dropdown` (con `trigger` propio y acciones con `value` e icono) e `Input` (con `icon`).
- Los vídeos están todos en la caché de YouTube y se paginan en memoria (`lib/youtube/videos.ts`, `videoPage`), así que buscar es filtrar esa lista, sin llamar a YouTube.
- El marco de la portada (`Hero.tsx`) va en una columna `flex-[1_1_340px]` junto a otra `flex-[999_1_440px]`: casi todo el sobrante va al texto y el marco se queda en unos 340 px.
- El estudio (`app/(web)/studio/(app)/layout.tsx`) pone `main` con `max-w-295` y sin centrar.
- Las escenas:
  - Las montadas (`components/overlay/scenes/layouts.tsx`) son lienzos fijos de 1920×1080 con piezas en posición absoluta, unas desde la izquierda y otras desde la derecha. La alerta de juego va en `left-[720px]`, y la de Just Chatting y el chat, en `left-[1352px]` y `left-[1328px]`. El hueco de la cámara (`CAMERA_HOLE`) es una máscara SVG de 1920×1080.
  - Las de pantalla completa son `StreamScene` de Regula. En 0.8.0 dibuja siempre 1920×1080; en 0.8.1 acepta `width` (lienzo lógico de ese ancho por 1080, entero de al menos 1920; otro valor se trata como 1920) y se escala con `scale`. Para 3440×1440 la propia documentación indica `width={2580}` con `scale={4/3}`. El pie (canal, línea y enlace) va de lado a lado con `left-20 right-20`.
  - El estudio genera las URL en `lib/studio/overlay-urls.ts` y enseña las vistas previas a 360×202.

## Goals / Non-Goals

**Goals:**
- Que la cabecera de la web se lea como la de una web de documentación: subrayado, a todo el ancho, con tema y buscador a la derecha, y que nada se mueva al cambiar de tema.
- Buscar vídeos y directos desde cualquier página de la web.
- Escenas en 3440×1440 sin duplicar los repartos de 1920×1080.

**Non-Goals:**
- Cambiar más Regula. `ProgressSteps` sigue igual en 0.8.1, así que la excepción de `axe` de la portada (`label-content-name-mismatch` en los pasos de «Cómo va un directo») se queda.
- Más lienzos que 3440×1440 (2560×1080, 4K…). El diseño deja la puerta abierta, pero solo se acepta ese valor.
- Buscador en el estudio, sugerencias mientras se escribe o búsqueda en YouTube.

## Decisions

### 1. Cabecera: `underline`, `fullWidth` y el orden de la derecha

`HeaderNav type="underline" fullWidth`. En escritorio, `actions` lleva el selector de tema y después el buscador. Así el buscador, que es lo más ancho, queda en el borde y el selector a su izquierda, como se pidió.

En móvil, con `mobileActions` (Regula 0.8.1), las `actions` salen también en la fila de arriba. Ahí solo cabe el selector de tema, así que el buscador de `actions` se oculta por debajo del punto de corte de la cabecera (`hidden @5xl:block`, el mismo contenedor que usa `HeaderNav`) y va además en el `search` de `HeaderNav`, arriba del panel del menú. Así el tema se cambia en móvil sin abrir el menú, que hoy no se puede. Como `actions` se pinta dos veces, ni `ThemeMenu` ni `VideoSearch` llevan `id` fijos (los del campo salen de `useId`).

### 2. Selector de tema: `Dropdown` con disparador de ancho fijo

Un `ThemeMenu` (sustituye a `ThemeToggle`) con `Dropdown` y tres acciones: «Claro» (`Sun`), «Oscuro» (`Moon01`) y «Sistema» (`Monitor01`), con la actual marcada.

El disparador es un botón terciario de solo icono, de tamaño fijo, con el icono de «Sistema» o del tema elegido y el nombre accesible «Tema: <opción>». Al no llevar texto, mide lo mismo con cualquier opción y la cabecera no se mueve.

- «Claro» y «Oscuro» guardan `localStorage.theme` y ponen la clase `dark-mode`, como ahora.
- «Sistema» borra `localStorage.theme` y aplica `prefers-color-scheme`. `theme-init.js` ya escucha los cambios del sistema cuando no hay elección guardada, así que no hace falta tocarlo.
- Hasta hidratar se pinta el icono de «Sistema»: es lo que tiene quien entra por primera vez. Quien tiene elección guardada ve cambiar el icono en la hidratación, pero el botón no cambia de tamaño.

Alternativa descartada: un `Select` con texto («Claro», «Oscuro», «Sistema»). Las palabras miden distinto y vuelve el salto de la cabecera, salvo que se fije un ancho que en móvil no cabe.

### 3. Buscador: formulario GET a `/videos`

Es un `form` con `action="/videos"` y `method="get"`, con un `Input type="search" name="q"`, el icono `SearchLg`, la etiqueta «Buscar vídeos» (oculta a la vista, presente para el lector) y un marcador «Buscar vídeos y directos». Funciona sin JavaScript.

En el cliente se intercepta el envío para navegar con el router y no recargar. Si el texto está vacío, va a `/videos`. En `/videos`, el campo arranca con el `q` de la URL (`useSearchParams`).

El ancho del campo es fijo (unos 280 px) en escritorio.

### 4. Filtro por texto en `videoPage`

`videoPage(videos, filter, page, query?)`. El texto se normaliza (minúsculas, sin tildes con `NFD` y quitando las marcas diacríticas, y espacios recortados) y se busca como subcadena en el título y, en los directos, en el juego (`parsed.title` y `parsed.game`). Se filtra antes de paginar, así que la paginación cuenta solo los resultados.

`q` va con un máximo de 80 caracteres (`text(q, "q", "", 80)`). La página de vídeos lo arrastra en todos sus enlaces: pestañas, `Pager` y tarjetas (`videosHref`), y las pestañas lo conservan.

Sin resultados con `q`, en lugar de `NoVideos` se enseña un `EmptyState` «Nada con "<texto>"» con el botón «Quitar la búsqueda», que lleva a `/videos` con el mismo `type`. El vídeo que suena (`v`) se sigue pudiendo abrir aunque no esté entre los resultados.

### 5. Marco de la portada

Las columnas pasan a `flex-[1_1_440px]` (texto) y `flex-[1_1_480px]` (marco). El marco mide `w-full max-w-160` (hasta 640 px) y se alinea a la derecha en escritorio. A 1440 px queda en unos 600–640 px, como en el lienzo. En móvil ocupa todo el ancho, como ahora. `FitScene` ya mide el contenedor, así que la escena de juego escala sola.

### 6. Estudio centrado

`main` lleva `mx-auto` dentro de un contenedor `flex-1` que ocupa el espacio a la derecha de la barra lateral: el contenido (máximo 1180 px) queda centrado en ese espacio, no en la ventana.

### 7. Escenas en 3440×1440: lienzo lógico ancho y escala 4/3

Todo se resuelve con un lienzo lógico de **2580×1080** escalado por **4/3**: 2580 × 4/3 = 3440 y 1080 × 4/3 = 1440. Las piezas conservan su tamaño relativo a la altura (como pide la spec) y el ancho que sobra (660 px lógicos, 880 reales) va al centro.

- Nuevo `lib/overlay/canvas.ts`:
  - `CANVASES = { "1920x1080": { width: 1920, scale: 1 }, "3440x1440": { width: 2580, scale: 4/3 } }`.
  - `canvasOf(q)`, que lee `canvas` y vuelve a `1920x1080` si no lo reconoce.
  - Un componente `SceneCanvas` que pinta un contenedor del tamaño real (`width × scale` por `1080 × scale`) y dentro el lienzo lógico con `transform: scale()` y origen arriba a la izquierda.
- **Montadas** (`layouts.tsx`): `GameLayout` y `ChattingLayout` reciben `width` (1920 por defecto).
  - Las piezas ancladas a la izquierda no cambian.
  - Las de la derecha pasan de `left-[…]` a `right-[…]`: el chat de Just Chatting (1920 − 1328 − 528 = `right-[64px]`) y su alerta (1920 − 1352 − 480 = `right-[88px]`). Así se mantiene su posición exacta en 1920.
  - La alerta de juego se centra (`left-1/2 -translate-x-1/2`), que en 1920 da los mismos 720 px.
  - La máscara de `CAMERA_HOLE` se genera con el `width` del lienzo.
  - En 1920 todo queda en el mismo píxel: las referencias visuales actuales no cambian.
- **Pantalla completa**: `StreamScene width={canvas.width} scale={canvas.scale}` (Regula 0.8.1). El fondo, la cuadrícula y el pie van de lado a lado; el bloque central sigue centrado. No hace falta `SceneCanvas`: `StreamScene` ya mide `width × scale` por `1080 × scale`.
- Las páginas de escena leen `canvasOf(q)`: las montadas envuelven el contenido en `SceneCanvas` y las de pantalla completa pasan el lienzo a `StreamScene`. `?canvas=3440x1440` es un parámetro más, así que las URL de 1920 siguen igual.
- **Estudio**:
  - En la pestaña «Escenas», un `Select` «Lienzo» («1920 × 1080» o «3440 × 1440») encima de las tarjetas, guardado en la URL (`?tab=scenes&canvas=3440x1440`), como la pestaña.
  - `sourceUrl` añade `canvas` solo cuando no es el de por defecto.
  - Las vistas previas usan una caja de 21:9 (360×151) con la escala ajustada, y la insignia de tamaño dice «3440 × 1440».

## Risks / Trade-offs

- [Subir a Regula 0.8.1 puede traer otros cambios] → Es una versión de parche con `StreamScene.width` y `HeaderNav.mobileActions`, ambos opcionales. Se sube primero y se pasa `bun run ci` y `bun run test:e2e` antes de tocar nada más.
- [`actions` duplicado en el HTML con `mobileActions`] → Dos buscadores y dos selectores en el DOM, uno oculto con CSS. Las pruebas buscan los visibles (`locator("visible=true")`) y el `axe` no se queja de `id` repetidos porque no los hay.
- [Piezas a 4/3: el texto del chat y las alertas se reescala] → Es lo que hace OBS al subir una escena de 1080 a 1440. Con `transform` el texto se rasteriza a la resolución final, así que se ve nítido.
- [Pasar piezas de `left` a `right` puede mover un píxel en 1920] → Las comparaciones visuales de `overlay-layout.spec.ts` y `mounted-scenes.spec.ts` tienen que pasar sin regenerar en 1920. Para 3440 se añaden referencias nuevas.
- [El buscador en el panel móvil solo se ve al abrir el menú] → Es como lo plantea `HeaderNav`. La página de vídeos sigue mostrando el `q` activo en su propio campo de la cabecera al abrir el menú.
- [Hidratación del selector de tema] → El icono puede cambiar al hidratar si hay elección guardada, pero el botón no cambia de tamaño, que es lo que pedía «evitar layout switch».

## Migration Plan

Primero se sube `@jotis-me/react` a `^0.8.1`. Sin migración de datos. Las URL de OBS existentes siguen siendo válidas (1920×1080 por defecto). Quien quiera ultrapanorámico copia las URL nuevas desde el estudio con el lienzo «3440 × 1440».
