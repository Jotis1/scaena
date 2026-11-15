# Proposal

## Why

Hoy solo hay una meta de Scaena y, si hay una meta activa en Twitch, manda ella sin que se pueda elegir. Con dos metas en Twitch falla: solo se guarda una, se machacan entre ellas con cada aviso de progreso y, al acabar la que se ve, vuelve la de Scaena aunque la otra siga activa. Queremos que sea el streamer quien elige qué meta sale, que pueda tener varias propias y que puedan ir rotando.

## What Changes

- **Varias metas de Scaena**, hasta 5, cada una con su tipo, texto, objetivo, unidad y cuenta propia. El servidor las hace avanzar todas a la vez, salgan o no. Siempre queda al menos una (no se puede borrar la última). La meta única que hay hoy pasa a ser la primera de la lista, con su cuenta.
- **Todas las metas activas de Twitch guardadas**, cada una por su id: un aviso de inicio o progreso actualiza solo la suya y uno de final borra solo la suya. Al pedirlas a Twitch se sustituye la lista entera. Arregla el fallo de las dos metas.
- **Selector «Qué meta sale»** en el estudio: un solo ajuste del canal que vale para la pieza de meta y para las escenas, y que llega en vivo a OBS. Opciones: cada meta de Scaena, cada meta activa de Twitch y «Rotar». Cada opción lleva delante el icono de Twitch o el de Scaena, sin texto de prefijo.
- **BREAKING (de comportamiento):** desaparece «la de Twitch manda». Por defecto sale la primera meta de Scaena; una meta de Twitch solo sale si se elige o si entra en la rotación.
- **Si acaba la meta de Twitch elegida**, sale la meta de Scaena por defecto y el estudio avisa de que la elegida ha terminado.
- **Rotar**: se marcan las metas que entran (de Scaena y de Twitch) y el intervalo (10, 20 o 30 s). La meta que sale se calcula a partir del reloj, de modo que la pieza y las escenas enseñan la misma a la vez. Pasa a la siguiente con un fundido, salvo sin animaciones. Las metas de Twitch que acaban salen solas de la rotación.
- **Al pasar del objetivo**, cada meta de la rotación tiene su opción: «Seguir» o «Sacar de la rotación». Solo afecta a la rotación: una meta elegida fija se queda llena. Si todas las metas salen de la rotación, se queda la última que salió.
- Versión 0.4.0.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `obs-overlays`: «Meta editable en el estudio» pasa a varias metas; «Meta de Twitch» deja de mandar sola y se elige. Se añaden «Qué meta sale» y «Rotación de metas».
- `twitch-events`: «Seguimiento de la meta de Twitch» guarda todas las metas activas por id; «Eventos recientes y metas» cuenta cada meta de Scaena por separado.

## Impact

- **Datos (Redis):** los ajustes del canal (`channel:<id>:settings`) pasan de `goal` a una lista `goals` y a una elección `show`. Hay una cuenta por meta y un hash con las metas de Twitch activas en lugar de una sola. Las claves `goal` y `twitch-goal` actuales se migran al leerlas.
- **Código:** `lib/alerts/saved-goal.ts`, `lib/alerts/twitch-goal.ts`, `lib/alerts/settings.ts`, `lib/redis/keys.ts`, `lib/twitch/goals.ts`, `lib/twitch/eventsub/webhook.ts`, `lib/events/initial.ts`, `lib/events/client.ts`, `components/overlay/LiveGoal.tsx`, `components/overlay/ChannelEvents.tsx`, las escenas, y en el estudio `GoalEditor`, `PieceOptions` y `OverlaySources`.
- **API:** `PUT /api/studio/settings` acepta la lista de metas y la elección; el evento SSE `goal` lleva lo que hay que pintar (una meta o la rotación).
- **Sin cambios** en las URLs de OBS: las piezas y las escenas no se vuelven a pegar.
