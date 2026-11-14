# Proposal

## Why

El estudio da las URL de los overlays, pero no explica cómo montarlos en OBS: dónde va cada fuente, a qué tamaño, en qué orden. En la escena de juego, la cámara de OBS es un rectángulo y el marco de Scaena tiene las esquinas redondeadas (16 px), así que las esquinas de la cámara siempre sobresalen. Además, la meta solo se configura en la URL de la pieza suelta. Las escenas de juego y Just Chatting no dejan elegirla y siempre salen con los valores por defecto. Cada cambio obliga a volver a pegar la URL en OBS.

## What Changes

- **Página «Guía de OBS»** en el estudio, como cuarta entrada del menú. Tiene una sección por escena montada (juego y Just Chatting) y otra para las escenas de pantalla completa. Cada sección da las fuentes que hay que añadir, de arriba abajo, y la posición y el tamaño de cada una en píxeles de OBS. Las medidas siguen el lienzo elegido (1920 × 1080 o 3440 × 1440) y vienen de las mismas constantes con las que se colocan las escenas, así que no pueden separarse. También da los ajustes de la fuente de navegador.
- **Cámara sin esquinas que sobresalgan** en la escena de juego. La guía da una máscara PNG descargable para el filtro «Máscara de imagen/mezcla» de OBS, con el radio del marco en proporción al ancho, para que valga con cualquier cámara 16:9, y explica los pasos. Just Chatting no la necesita: su fondo ya tapa las esquinas.
- **Cada tarjeta de escena** en Overlays enlaza a su sección de la guía.
- **Meta guardada en Scaena.** Su tipo, texto, objetivo y cuenta se editan en el estudio, en la tarjeta «Meta». La pieza suelta y las dos escenas montadas la usan, y un cambio llega en vivo a OBS sin volver a pegar URL ni recargar la fuente. La cuenta la lleva el servidor: no se pierde al cerrar OBS ni con el stream de eventos recortado a 10 minutos. Cambiar el texto o el objetivo no toca la cuenta; corregir «Llevas» la fija a ese valor.
- **Compatibilidad**: mientras no haya meta guardada, las URL con `type`, `label`, `start` y `goal` siguen funcionando como hoy. Una vez guardada, manda la guardada. El estudio deja de poner esos parámetros en las URL nuevas; `goal=0` sigue quitando la pieza de las escenas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `obs-overlays`: se añaden «Guía de montaje en OBS» y «Meta editable en el estudio»; cambia «Acceso al estudio con Twitch», que pasa a incluir la guía entre las páginas privadas.
- `twitch-events`: cambia «Eventos recientes y metas». La meta avanza con un contador del canal guardado en el servidor, no con lo que cuenta cada overlay.

## Impact

- **Estudio**: una página nueva en `app/(web)/studio/(app)/guide/`, `components/studio/StudioSidebar.tsx` (entrada del menú), `components/studio/OverlaySources.tsx` (la tarjeta «Meta» guarda en vez de montar la URL, y las tarjetas de escena enlazan a la guía) y `lib/studio/overlay-urls.ts` (sin parámetros de meta).
- **Medidas compartidas**: `components/overlay/scenes/layouts.tsx` pasa sus posiciones a constantes exportadas que leen el layout y la guía.
- **Recurso estático**: la máscara de cámara en `public/`.
- **Meta**: `lib/alerts/settings.ts` (configuración de la meta), un contador nuevo `channel:<id>:goal` en `lib/redis/keys.ts`, `incrby` en `lib/storage/types.ts` y sus dos implementaciones, `lib/twitch/eventsub/webhook.ts` (suma al contador y avisa por el stream), `app/api/events/route.ts` (manda la meta al conectar), `lib/events/client.ts` y `components/overlay/LiveGoal.tsx`. API: `PUT /api/studio/settings` acepta la meta.
- **Pruebas**: unitarias de ajustes, contador y webhook; e2e del estudio (guía y meta) y de los overlays (meta en vivo). El Redis falso de e2e (`e2e/fake-redis.ts`) necesita `INCRBY`.
- Las URL que ya están en OBS siguen funcionando.
