# Design

## Context

- **Escena de juego**: `GameLayout` (`components/overlay/scenes/layouts.tsx`) coloca las piezas con clases de Tailwind sueltas (`right-12 bottom-12`, etc.). La cámara es un `CamFrame` de 384 px a 16:9 con `rounded-2xl` (16 px) y el interior transparente. OBS pone la cámara debajo y, como es rectangular, sus esquinas asoman por fuera del radio. En Just Chatting no pasa, porque el fondo es opaco salvo el hueco `CAMERA_HOLE`, que ya va redondeado.
- **Lienzos**: el lógico mide `width` × 1080 (1920 o 2580). En 3440 × 1440, `SceneCanvas` lo escala a 4/3 (`lib/overlay/canvas.ts`).
- **Meta**: `LiveGoal` cuenta en el cliente: parte de `start` y suma con `goalIncrement` las alertas que le llegan por SSE desde `since`. El stream `channel:<id>:events` se recorta a 10 minutos (`RETENTION_MS`, `MINID ~`), así que, pasado ese tiempo, el servidor no puede recalcular nada a partir del stream. Las escenas aceptan los parámetros de la meta en la URL (`sceneOptions`), pero el estudio no los pone nunca.
- **Patrón que ya existe**: las frases de alerta se guardan en `channel:<id>:settings` (`lib/alerts/settings.ts`), se editan con `PUT /api/studio/settings` y llegan a los overlays como evento SSE `settings`, al conectar (`initial`) y en cada guardado (`xadd` al stream).

## Goals / Non-Goals

**Goals:**
- Una única fuente de medidas: la guía no puede decir algo distinto de lo que pinta la escena.
- Una cuenta de meta correcta con OBS cerrado, con varios overlays abiertos y tras reconectar.

**Non-Goals:**
- Más de una meta por canal, o metas que se reinician solas (por mes, por directo).
- Generar una colección de escenas de OBS para importar (JSON de OBS). Puede venir después, a partir de las mismas medidas.
- Recortar la cámara desde Scaena. OBS compone la cámara por debajo y la página no puede taparle las esquinas sin tapar también el juego.

## Decisions

### 1. Medidas de las escenas en constantes exportadas

`components/overlay/scenes/boxes.ts`, sin JSX, exporta la caja de la cámara de cada escena en el lienzo lógico (`x`, `y`, `width` y `height`). Es la única fuente que se coloca a mano en OBS: el resto de piezas van dentro de la fuente de la escena. Se calcula con una función de `width`, para que el ultrapanorámico salga de la misma regla. `GameLayout` y `ChattingLayout` pasan a colocar la cámara con `style` a partir de esas cajas, en vez de con clases sueltas. La guía las lee y las multiplica por la escala del lienzo (1 o 4/3). Así, los tests que comparan la posición en el DOM con la constante cubren también la guía.

- *Alternativa*: escribir las medidas a mano en la guía. Se rechaza porque se desincronizan con el primer ajuste del layout.

### 2. La máscara: un PNG generado con `ImageResponse`

Ruta `app/(web)/studio/guide/camera-mask.png/route.ts`, estática (`force-static`), con `ImageResponse` de `next/og`. Pinta un rectángulo blanco de 1920 × 1080 con radio `1920 × 16/384 = 80` sobre fondo transparente. El filtro «Máscara de imagen/mezcla» de OBS, en modo «Máscara alfa (canal alfa)», estira la imagen al tamaño nativo de la fuente, así que un solo PNG 16:9 vale para cualquier resolución de cámara 16:9 y para los dos lienzos. En 3440 la cámara es 512 × 288 con radio 21,3, que es la misma proporción. El radio sale de constantes compartidas con el marco (16 px sobre 384), no se escribe a mano. Con OBS no se puede usar SVG: el filtro solo carga imágenes rasterizadas.

- *Alternativa*: un PNG binario en `public/`. Se rechaza porque sería un fichero que no sale del código y habría que regenerarlo a mano si cambia el radio.
- *Alternativa*: recomendar un plugin de OBS de esquinas redondeadas. Se rechaza porque es una dependencia externa; el filtro de máscara viene con OBS.

La guía avisa de que la máscara se aplica a la fuente de la cámara sin recortar. Si se recorta la cámara, deja de ser 16:9 y la máscara se deforma.

### 3. La guía: página de servidor y lienzo en la URL

`/studio/guide?canvas=3440x1440`, con `canvasOf` como en Overlays. Cada sección tiene un ancla (`#game`, `#chatting`, `#fullscreen`). La tarjeta de escena enlaza a `/studio/guide?canvas=…#game`. La tabla por escena usa la `Table` de Regula sin funciones (lección de 0.0.1: es un componente de cliente y la página es de servidor). La guía no repite URL: dice qué tarjeta de Overlays copiar.

Orden de capas en la escena de juego, de arriba abajo: escena de Scaena (navegador, lienzo completo), cámara (con máscara) y captura del juego. En Just Chatting: escena de Scaena y, debajo, la cámara en el hueco. Ajustes de la fuente de navegador: el tamaño del lienzo, «Actualizar el navegador cuando la escena se active» y nada de CSS personalizado.

### 4. Meta: configuración en los ajustes y cuenta en un contador aparte

- **Configuración**: `settingsSchema` gana `goal?: { type, label, target, unit? }` en `channel:<id>:settings`, validado con zod (texto de hasta 40 caracteres, objetivo entero ≥ 1).
- **Cuenta**: un entero aparte en `channel:<id>:goal` (clave nueva en `ChannelKeyPart`). `Store` gana `incrby(key, n)`, en Upstash, en memoria y en el Redis falso de e2e.
- **Al llegar un evento** (`webhook.ts`, después de la marca de duplicado `nx`, así que cuenta una sola vez): si hay meta guardada y `goalIncrement(type, event) > 0`, se hace `incrby` y se añade al stream un evento `goal` con la meta completa y la cuenta nueva (`{ type, label, target, unit, current }`). Las alertas de prueba siguen sin sumar, porque `goalIncrement` ya devuelve 0.
- **Al conectar** (`initial` en `app/api/events/route.ts`): junto a `settings` se manda `goal` con la cuenta actual. Un overlay que reconecta recibe primero el valor absoluto y después los eventos que se perdió. Como estos solo traen alertas, no los vuelve a contar.
- **Al guardar en el estudio**: `PUT /api/studio/settings` acepta `goal` y `current` opcional. Si llega `current`, se fija la cuenta con `set`; si no, se conserva. Después se publica un evento `goal`.
- **En el overlay**: `LiveGoal` pasa a dos modos. Con una meta del servidor recibida (evento `goal`), pinta el valor absoluto y no suma nada por su cuenta. Si no le llega ninguna (no hay meta guardada), cuenta como hoy, con los parámetros de la URL. El cambio de modo es en vivo: guardar la primera meta convierte a la vez los overlays antiguos.

Por qué un contador y no recalcular: el stream solo guarda 10 minutos y la meta dura semanas. Por qué un evento absoluto y no un incremento: sumar en el cliente duplica la cuenta cuando, al reconectar, se combina el valor inicial con los eventos reproducidos. El valor absoluto es idempotente.

- *Alternativa*: guardar el `since` y pedir a Twitch el histórico. Se rechaza porque Twitch no da el histórico de follows y subs por rango a esta app.

### 5. El estudio deja de poner la meta en la URL

`sourceUrl("goal")` deja de llevar `type`, `label`, `start` y `goal`, y queda solo con el token. Las escenas siguen con `goal=0` para quitar la pieza. La tarjeta «Meta» de Overlays pasa a ser un formulario que guarda («Guardar meta»), con un campo «Llevas» precargado con la cuenta actual (`GET /api/studio/settings` la devuelve). Su vista previa enseña la meta guardada, y las vistas previas de las escenas también.

## Risks / Trade-offs

- [Al pasar a la meta guardada, las URL antiguas con `goal=50` cambian a la meta guardada sin avisar] → Es lo que se pide: una sola meta. La tarjeta lo dice: «Se usa en la pieza de meta y en las escenas de juego y Just Chatting».
- [`incrby` y `xadd` no son atómicos juntos: si falla el `xadd`, los overlays no se enteran hasta reconectar] → El contador es la verdad y el siguiente evento o reconexión lo corrige. El fallo se registra en el log.
- [El filtro de OBS se llama distinto según el idioma y la versión] → La guía da el nombre en castellano y en inglés («Image Mask/Blend») y el tipo «Máscara alfa».
- [Una cámara que no es 16:9 deforma la máscara] → La guía lo avisa, y la escena de juego solo usa 16:9.

## Migration Plan

Sin migración de datos: sin meta guardada, todo se comporta como hoy. El despliegue puede hacerse en cualquier orden. Para volver atrás basta con revertir: los ajustes con `goal` son compatibles hacia atrás, porque el esquema viejo es un objeto y descarta las claves que no conoce.
