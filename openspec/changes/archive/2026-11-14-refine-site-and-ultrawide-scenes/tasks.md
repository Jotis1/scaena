# Tasks

Las reglas de regula.jotis.me siguen mandando. Las e2e del estudio necesitan Postgres (README, «Los tests de navegador usan su propio Postgres»).

## 0. Regula 0.8.1

- [x] 0.1 Subir `@jotis-me/react` a `^0.8.1` (`bun add @jotis-me/react@^0.8.1`). Verificar que `bun run ci` y `bun run test:e2e` pasan sin tocar nada más

## 1. Selector de tema

- [x] 1.1 Crear `components/web/ThemeMenu.tsx` con `Dropdown`: «Claro», «Oscuro» y «Sistema», la actual marcada, y un disparador de solo icono, de tamaño fijo, con el nombre «Tema: <opción>». «Sistema» borra `localStorage.theme` y aplica `prefers-color-scheme` (design.md, decisión 2). Sustituir `ThemeToggle` en la web, la entrada y las cabeceras del estudio, y borrarlo. Verificar en `e2e/theme.spec.ts` los cuatro escenarios de «Claro y oscuro», y que la caja del disparador mide lo mismo antes y después de cambiar de tema

## 2. Cabecera de la web

- [x] 2.1 `SiteHeader` con `HeaderNav type="underline" fullWidth mobileActions`: en `actions`, el selector de tema y después el buscador, este oculto por debajo de `@5xl`; el buscador también en `search` (design.md, decisión 1). Verificar en `e2e/site.spec.ts` «Página actual en la cabecera» (subrayado, sin fondo), «Cabecera a todo el ancho» a 1920 px, que a 390 px el selector de tema se ve en la fila de arriba sin abrir el menú y el buscador sale al abrirlo, y que no hay desplazamiento horizontal a 390 px

## 3. Buscador

- [x] 3.1 Añadir el filtro por texto a `videoPage` en `lib/youtube/videos.ts`: título y juego, sin mayúsculas ni tildes, antes de paginar (design.md, decisión 4). Verificar con tests en `lib/youtube/videos.test.ts` que «cyberpunk» encuentra por juego, que «ciudad que nunca duerme» encuentra «La Ciudad que Nunca Duerme», y que la paginación cuenta solo los resultados combinados con «Directos»
- [x] 3.2 Crear `components/web/VideoSearch.tsx`: un formulario GET a `/videos` con `Input type="search" name="q"`, que navega en el cliente, va a `/videos` si está vacío y arranca con el `q` de la URL. Verificar en `e2e/videos.spec.ts` «Buscar desde la portada» y «Búsqueda vacía»
- [x] 3.3 Llevar `q` en `/videos`: leerlo (máximo 80 caracteres), pasarlo a `videoPage`, conservarlo en pestañas, `Pager` y tarjetas, y el estado vacío «Nada con "<texto>"» con «Quitar la búsqueda». Verificar en `e2e/videos.spec.ts` «Buscar dentro de un filtro», «Sin resultados» y que el `axe` sigue sin errores

## 4. Portada y estudio

- [x] 4.1 Agrandar el marco de `Hero.tsx`: columnas `flex-[1_1_440px]` y `flex-[1_1_480px]`, y el marco `w-full max-w-160` (design.md, decisión 5). Verificar en `e2e/site.spec.ts` que a 1440 px el marco mide al menos 560 px de ancho y que a 390 px no hay desplazamiento horizontal
- [x] 4.2 Centrar el contenido del estudio en el espacio de la derecha de la barra lateral (design.md, decisión 6). Verificar en `e2e/studio.spec.ts` que a 1920 px los márgenes a izquierda y derecha de `main` dentro de ese espacio difieren en menos de 2 px

## 5. Escenas en 3440×1440

- [x] 5.1 Crear `lib/overlay/canvas.ts` con `CANVASES`, `canvasOf` y `SceneCanvas` (lienzo lógico de 2580×1080 a 4/3; design.md, decisión 7). Verificar con tests en `lib/overlay/canvas.test.ts` que `canvas=3440x1440` da ancho 2580 y escala 4/3, y que un valor desconocido o ausente da 1920×1080
- [x] 5.2 Dar `width` a `GameLayout` y `ChattingLayout`: las piezas de la derecha ancladas con `right-[…]`, la alerta de juego centrada y la máscara de la cámara al ancho del lienzo. Verificar que `e2e/overlay-layout.spec.ts` y `e2e/mounted-scenes.spec.ts` pasan en 1920×1080 sin regenerar referencias
- [x] 5.3 Leer `canvas` en las páginas de escena (`scene/[variant]`, `scene/game`, `scene/chatting`): las montadas, envueltas en `SceneCanvas`; las de pantalla completa, `StreamScene width={canvas.width} scale={canvas.scale}`, con el pie de lado a lado. Verificar en `e2e/scenes.spec.ts` y `e2e/mounted-scenes.spec.ts`, con una ventana de 3440×1440, «Escena en ultrapanorámico», «Centro libre en ultrapanorámico», «Just Chatting en ultrapanorámico» y «Lienzo no reconocido», y añadir sus referencias visuales a 3440×1440 tras revisarlas a mano
- [x] 5.4 En el estudio, el `Select` «Lienzo» en la pestaña «Escenas», guardado en `?canvas=`; `sourceUrl` con `canvas` cuando no es el de por defecto; vistas previas en 21:9 y la insignia con el tamaño. Verificar con tests en `lib/studio/overlay-urls.test.ts` que la URL lleva `canvas=3440x1440` solo en las escenas y solo si se elige, y en `e2e/studio.spec.ts` «Escenas en ultrapanorámico»

## 6. Cierre

- [x] 6.1 Pasar todo junto. Verificar que `bun run ci` y `bun run test:e2e` pasan
- [x] 6.2 Revisar a mano en claro, en oscuro y a 390 px la cabecera, la portada, vídeos con búsqueda y el estudio, y a 3440×1440 las seis escenas. Verificar que el usuario da por buenas las capturas o que cada diferencia queda apuntada
- [x] 6.3 Verificar que `openspec validate refine-site-and-ultrawide-scenes --strict` pasa
