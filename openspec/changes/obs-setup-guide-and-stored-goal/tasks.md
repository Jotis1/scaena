# Tasks

Las e2e se ejecutan en serie y necesitan el Postgres de Docker (`scaena-e2e-db`) y el Redis falso (`e2e/fake-redis.ts`).

## 1. Medidas compartidas de las escenas

- [x] 1.1 Exportar desde `components/overlay/scenes/boxes.ts` (sin JSX, para que lo lean también las e2e) la caja de la cámara de juego y de Just Chatting, que es la única fuente que se coloca a mano en OBS, en función del ancho lógico, más el radio del marco (16 sobre 384). `GameLayout` y `ChattingLayout` colocan la cámara con esas cajas (design.md, decisión 1). Verificar con un test unitario que en 1920 la cámara de juego es `{x: 1488, y: 816, width: 384, height: 216}` y en 2580 es `x: 2148`; que `e2e/mounted-scenes.spec.ts` y `e2e/scenes.spec.ts` siguen pasando; y, en `mounted-scenes`, que la caja de `[data-piece="camera"]` coincide con la constante en los dos lienzos

## 2. Guía de OBS

- [x] 2.1 Ruta `app/(web)/studio/guide/camera-mask.png/route.ts` con `ImageResponse`: PNG de 1920 × 1080, rectángulo blanco con el radio proporcional y transparente fuera, estático (design.md, decisión 2). Verificar con una e2e que con sesión responde `image/png` de 1920 × 1080, con el píxel (0, 0) transparente y el (960, 540) blanco opaco
- [x] 2.2 Página `app/(web)/studio/(app)/guide/page.tsx`: selector de lienzo (`?canvas=`), una sección por escena con ancla (`#game`, `#chatting`, `#fullscreen`), una tabla de fuentes en orden de capas con posición y tamaño a la escala del lienzo, los ajustes de la fuente de navegador, y, en juego, «Descargar máscara» y los pasos del filtro (nombre en castellano y en inglés, modo «Máscara alfa», sin recortar la cámara). En Just Chatting, que no hace falta máscara. La tabla no recibe funciones (design.md, decisión 3). Verificar en `e2e/studio.spec.ts` los escenarios «Medidas de la escena de juego», «Medidas en ultrapanorámico» y «Descargar máscara», y que `axe` no da errores
- [x] 2.3 Añadir «Guía de OBS» al menú (`StudioSidebar.tsx`) y «Cómo montarla» en las tarjetas de escena de Overlays, con el lienzo elegido y el ancla. Verificar en `e2e/studio.spec.ts` «Enlace desde Overlays», que la guía sin sesión lleva a `/studio/login` y que las comprobaciones existentes de todas las páginas del estudio (centrado, cabecera) incluyen `/studio/guide`

## 3. Meta guardada: almacén y servidor

- [x] 3.1 Añadir `incrby` a `Store` (`lib/storage/types.ts`), a `memory.ts`, a `redis.ts` y a `INCRBY` en `e2e/fake-redis.ts`, y la clave `"goal"` a `ChannelKeyPart`. Verificar con tests de `memory.ts` que `incrby` crea la clave a 0 y suma, y con `bun run test:e2e` que el Redis falso sigue arrancando
- [x] 3.2 En `lib/alerts/settings.ts` el esquema de `goal` y en `lib/alerts/saved-goal.ts` (tipo, texto de hasta 40, objetivo entero ≥ 1, unidad opcional), `readGoal` (configuración y cuenta), y que `saveSettings` acepte `goal` y `current` (con `current`, fija la cuenta; sin él, la conserva) y publique un evento `goal` con el valor absoluto. Guardar frases sin `goal` no borra la meta (design.md, decisión 4). Verificar con tests en `lib/alerts/saved-goal.test.ts` «Cambiar el objetivo» (la cuenta se conserva), «Corregir la cuenta», «Objetivo no válido» (error de campo), que al guardar solo frases la meta sigue y que el stream recibe el evento `goal`
- [x] 3.3 En `lib/twitch/eventsub/webhook.ts`, tras la marca de duplicado: si hay meta guardada y el evento suma, `incrby` y evento `goal` en el stream. Verificar con tests en `webhook.test.ts` que una sub regalada de 5 con la meta de subs en 284 deja 289 y publica `goal`, que el mismo mensaje repetido no vuelve a sumar, que un follow no mueve la meta de subs y que un evento de prueba no suma
- [x] 3.4 `app/api/events/route.ts`: en `initial`, además de `settings`, el evento `goal` con la cuenta actual si hay meta guardada; `GET /api/studio/settings` devuelve también la meta y la cuenta. Verificar con un test de `lib/events/initial.ts` (lo que manda la ruta al conectar) que el primer mensaje SSE trae `goal` con la cuenta guardada y que sin meta guardada no se manda

## 4. Meta guardada: overlays

- [x] 4.1 `lib/events/client.ts`: `onGoal` para el evento `goal`; `ChannelEventsProvider` expone la meta recibida. `LiveGoal` pinta la meta del servidor si la hay y, si no, cuenta como hoy con los parámetros de la URL (design.md, decisión 4). Verificar con tests de `client.test.ts` (llega `goal` y se entrega) y con una e2e en `e2e/live-overlays.spec.ts` que, sin meta guardada, `type=follows&start=10&goal=50` muestra 10 de 50 y suma con un follow, y que, con una meta de subs guardada, esa misma URL muestra la guardada («La meta guardada manda»)
- [x] 4.2 E2e de meta en vivo: con la escena de juego abierta y la meta en 290 de 300, guardar el objetivo 350 desde el estudio y ver 290 de 350 sin recargar; con la pieza y la escena abiertas a la vez, un evento de sub hace subir las dos 1 («Dos overlays con la misma meta»); y, con la cuenta en 40, después de tres follows sin ningún overlay abierto, abrir la pieza muestra 43 («Eventos con OBS cerrado»). Verificar con `bun run test:e2e`

## 5. Meta guardada: estudio

- [x] 5.1 La tarjeta «Meta» de Overlays pasa a ser un formulario que guarda: tipo, texto, objetivo y «Llevas» (con la cuenta actual), «Guardar meta», los errores por campo y el aviso «Se usa en la pieza de meta y en las escenas de juego y Just Chatting». Las vistas previas de la pieza y de las dos escenas enseñan la meta guardada (design.md, decisión 5). Verificar en `e2e/studio.spec.ts` que guardar «Seguidores», 50 y «Llevas» 10 deja la vista previa de la escena de juego en 10 de 50 y que, al recargar, el formulario mantiene esos valores
- [x] 5.2 `sourceUrl` en `lib/studio/overlay-urls.ts`: la meta suelta solo lleva el token; las escenas no llevan parámetros de meta (`goal=0` sigue quitando la pieza). Verificar actualizando `lib/studio/overlay-urls.test.ts` («la meta lleva tipo, cifras, since y token» pasa a «la meta solo lleva el token») y que «escenas montadas: token y piezas quitadas con 0» sigue pasando

## 6. Integración

- [x] 6.1 `bun run ci` y `bun run test:e2e` en verde, y `openspec validate obs-setup-guide-and-stored-goal --strict` sin errores
- [x] 6.2 Revisión a mano con capturas (`E2E_SHOTS`): la guía en 1920 × 1080 y en 3440 × 1440, claro y oscuro, y la tarjeta de meta. Verificarlo con el visto bueno del usuario
