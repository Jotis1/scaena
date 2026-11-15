# Design

## Context

Hoy la meta funciona así:

- **Meta de Scaena:** una sola, en los ajustes del canal (`channel:<id>:settings`, campo `goal`, `lib/alerts/settings.ts`). Su cuenta va en un entero aparte (`channel:<id>:goal`). `countGoalEvent` (`lib/alerts/saved-goal.ts`) la suma con `INCRBY` después de descartar los duplicados de EventSub.
- **Meta de Twitch:** una sola, en `channel:<id>:twitch-goal` (`lib/alerts/twitch-goal.ts`). El webhook la machaca con cada aviso de inicio o progreso y la borra al final si el id coincide. `syncTwitchGoal` (`lib/twitch/goals.ts`) pide `GET /helix/goals` y se queda con la más reciente.
- **Qué se ve:** `resolveGoal` elige la de Twitch si la hay y si no la de Scaena. `publishGoal` la manda por el evento SSE `goal`, e `initialEvents` la envía al conectar.
- **Overlay:** `LiveGoal` pinta la meta que llega por `ChannelEvents`. Sin ella usa los parámetros de la URL.
- **Estudio:** `GoalOptions` (en `PieceOptions.tsx`) muestra `GoalEditor`, que hace `PUT /api/studio/settings` con `{ goal, current? }`. Se usa en la pieza «Meta» y en el bloque «Meta» de las escenas.

`Store` (`lib/storage/types.ts`) tiene `get`, `set`, `del`, `incrby`, `hset`, `hgetall`, `xadd` y `xrange`, pero no `hdel`. El `Select` de Regula admite `icon` en cada opción, y el icono puede ser un elemento de React. Así el logo puede llevar su propio color en lugar del `fg-quaternary` del componente.

## Goals / Non-Goals

**Goals:**
- Hasta 5 metas de Scaena con cuenta propia, y todas las metas activas de Twitch guardadas por id.
- Un solo ajuste «Qué meta sale» (una meta fija o «Rotar») que llega en vivo a la pieza y a las escenas.
- Una rotación sincronizada entre fuentes, con la opción por meta de sacarla al cumplirse.
- Migrar sin perder la meta ni la cuenta actuales, y sin volver a pegar URLs en OBS.

**Non-Goals:**
- Elegir una meta distinta en cada pieza o escena.
- Crear o editar metas de Twitch desde Scaena: se hace en el panel de creador de Twitch.
- Celebrar una meta cumplida con una animación o una alerta.
- Reordenar las metas arrastrándolas. El orden es el de creación, y la primera es la de por defecto.

## Decisions

### 1. Modelo en los ajustes del canal

`settingsSchema` cambia `goal` por:

```ts
goals: Array<{ id: string; type; label; target; unit? }>   // 0..5; id = 8 caracteres [a-z0-9]
show?:
  | { kind: "one"; ref: GoalRef }
  | { kind: "rotate"; every: 10 | 20 | 30; items: Array<{ ref: GoalRef; whenDone: "keep" | "drop" }> }
endedTwitch?: string   // descripción de la meta de Twitch elegida que terminó (aviso en el estudio)
// GoalRef = `scaena:<id>` | `twitch:<id>`
```

- **Sin `show`, o con un `ref` que ya no existe:** sale la primera meta de Scaena, sin escribir nada. Así no hay que limpiar los ajustes al borrar una meta.
- **Las cifras viven fuera de `settings`:** la cuenta de cada meta va en su clave. Así un `INCRBY` no compite con quien guarda los ajustes.
- **Descartado:** guardar la elección en la URL de cada fuente. Obligaría a tocar OBS en directo, y el usuario pidió un solo ajuste.

### 2. Claves en Redis

| Clave | Contenido |
|---|---|
| `channel:<id>:goal:<goalId>` | Cuenta de cada meta de Scaena (`INCRBY`). |
| `channel:<id>:goal-done` | Hash `ref → ms`: cuándo cruzó su objetivo cada meta. Sirve para sacarla de la rotación y para saber «la última que salió». |
| `channel:<id>:twitch-goals` | Hash `id de meta de Twitch → JSON`. `hset` por campo, de modo que dos avisos de metas distintas no se pisan. |

- `ChannelKeyPart` admite `` `goal:${string}` `` y `keys` valida el `goalId` con `/^[a-z0-9]{8}$/`, igual que hace con el id del canal.
- Se añade `hdel` a `Store`, en la versión de Upstash y en la de memoria, para borrar una sola meta de Twitch al final.
- **Descartado:** guardar las metas de Twitch como un solo JSON. Leer, modificar y escribir con dos avisos casi a la vez perdería uno.

### 3. Migración al leer

`readGoals(store, channelId)` hace la migración una vez:

- Si los ajustes tienen el `goal` antiguo y no tienen `goals`, crea `goals = [{ id: nuevo, ...goal }]` y copia la cuenta de `channel:<id>:goal` a `goal:<nuevo>` (`set` con `nx`). Después guarda los ajustes y borra la clave antigua.
- La clave `twitch-goal` antigua se borra sin más. Se rellena con la siguiente consulta a Helix, que ocurre al abrir Overlays, o con el siguiente aviso.

Si dos lecturas migran a la vez, la segunda vería ya `goals` o fallaría el `nx`. Como mucho quedaría un id distinto guardado una sola vez. Lo cubre un test.

### 4. Lo que reciben los overlays: `GoalView`

Se publica un evento SSE nuevo, `goal-view`, con lo que hay que pintar:

```ts
type GoalView =
  | { kind: "one"; goal: GoalState }
  | { kind: "rotate"; every: number; goals: GoalState[]; serverNow: number }
```

- `resolveGoalView` calcula la vista en el servidor:
  - En modo `one`: la meta del `ref`. Si no existe o es de Twitch y ya no está, la primera de Scaena.
  - En modo `rotate`: las metas marcadas que existen, en su orden, sin las que tienen `whenDone: "drop"` y entrada en `goal-done`. Si no queda ninguna, `[la de goal-done más reciente]`: «se queda la última que salió». Si tampoco hay ninguna así, la primera de Scaena.
- El cliente elige la meta con `goals[floor((Date.now() + offset) / (every * 1000)) % goals.length]`, donde `offset = serverNow - Date.now()` se toma al recibir la vista. Todas las fuentes usan el mismo reloj de época, así que enseñan la misma meta aunque se abrieran en momentos distintos. El estudio, que se ve en otro navegador, también coincide.
- **Se publica la vista entera** cada vez que cambia algo: cuenta, aviso de Twitch, ajustes o una meta que cruza el objetivo. Son como mucho unas decenas de metas pequeñas, así que mandar la vista entera no supone un coste.
- **Descartado:** un temporizador que arranca en cada fuente, porque se desfasarían. También que el servidor empuje cada cambio de turno, porque serían eventos cada 10 s en el stream durante horas.
- **Evento nuevo** en lugar de cambiar la forma de `goal`: una fuente abierta con la versión anterior lo ignora en vez de romperse. Hay que avisar de que conviene actualizar las fuentes de OBS una vez tras el despliegue (tarea 9.3).

### 5. Cuándo una meta «cruza el objetivo»

- **Meta de Scaena:** `countGoalEvent` compara la cuenta antes y después del `INCRBY`. Si pasa de `< target` a `>= target`, hace `hset goal-done { "scaena:<id>": now }`. Al guardar la meta, si la cuenta queda por debajo del objetivo, porque se ha corregido la cuenta o se ha subido el objetivo, se borra su entrada con `hdel`. Si queda igual o por encima y no tenía entrada, se crea.
- **Meta de Twitch:** con cada aviso, si `current >= target` y no tenía entrada, se crea. Al acabar, se borra la meta y su entrada.

Esto vale para cualquier meta, esté o no en la rotación. Así, si se activa «Sacar» más tarde, ya se sabe si está cumplida.

### 6. Avisos de Twitch

- `begin` y `progress` hacen `hset twitch-goals { id: JSON }`.
- `end` hace `hdel` de esa meta. Además:
  - Si `show` es `one` con esa meta, `show` pasa a la meta de Scaena por defecto (se borra `show`) y se guarda `endedTwitch` con su descripción.
  - Si es `rotate`, se quita de `items`.
  - Después se publica la vista.
- `syncTwitchGoal` pasa a `syncTwitchGoals`: sustituye el hash por la lista de Helix. Las metas elegidas que ya no están se tratan como un final. Si la llamada falla, no toca nada.
- `endedTwitch` se borra cuando el usuario cambia «Qué meta sale» o cierra el aviso.

### 7. Estudio

`GoalOptions` pasa a ser `GoalManager`, y se usa igual en la pieza «Meta» y en el bloque «Meta» de las escenas:

1. **Selector «Qué meta sale»** (`Select`): una opción por meta de Scaena (su texto, con el objetivo de apoyo), una por meta de Twitch (su descripción o el texto del tipo) y «Rotar». Los iconos son `<ScaenaMark/>`, un componente nuevo con el SVG de `app/favicon.svg`, y `<SocialLogo network="twitch"/>`, como elementos con su color.
2. **Con «Rotar»:** una casilla por meta, con su `Select` «Al cumplirse: Seguir / Sacar de la rotación», y el `Select` del intervalo (10, 20 o 30 s).
3. **«Tus metas»:** un `Accordion` con un `GoalEditor` por meta de Scaena, «Borrar» (deshabilitado con una sola) y «Añadir meta» (deshabilitado con 5, con el texto «Como mucho, 5 metas»).
4. **«En Twitch»:** las metas activas para leer, con su progreso y el texto «Se editan en el panel de creador de Twitch».
5. **Alerta `endedTwitch`**, con «Entendido».

La vista previa de la pieza y de las escenas usa la misma `GoalView` y la misma elección por reloj.

### 8. API

`/api/studio/settings`:

| Petición | Qué hace |
|---|---|
| `GET` | Devuelve `{ settings, goals: GoalState[], twitchGoals: GoalState[], view: GoalView }`. |
| `PUT { goal: { id?, type, label, target, unit? }, current? }` | Crea la meta (sin `id`, con un máximo de 5) o la edita. Lo de la cuenta es como hoy. |
| `DELETE ?goal=<id>` | Borra la meta. Con una sola, responde 400 con el mensaje, como el resto de errores. Borra también su cuenta y su entrada de `goal-done`. |
| `PUT { show }` | Valida los `ref` contra las metas existentes y borra `endedTwitch`. |
| `PUT { dismissEnded: true }` | Borra `endedTwitch`. |

Los errores siguen la forma de `SettingsError`, con un mensaje por campo.

### 9. Overlay

- `ChannelEvents` guarda la `GoalView` en lugar de la `GoalState`.
- `LiveGoal`, con vista, pinta la meta elegida. En modo `rotate` usa un `setInterval` de 1 s que solo cambia el estado al cambiar el índice. El cambio lleva un fundido de 300 ms de opacidad, salvo con `animate` apagado (`SceneOptions.animate`) o con `prefers-reduced-motion`.
- Sin vista, porque el canal no tiene metas, usa la URL como hoy.
- La meta fija cumplida se pinta llena, como hoy hace `StreamGoal` con `current >= goal`.

## Risks / Trade-offs

- **Relojes de las fuentes:** pueden diferir unos ms entre fuentes de OBS, porque son el mismo proceso, o algo más con el estudio en otro equipo. El `offset` con `serverNow` lo corrige al conectar. → Basta con que coincidan al segundo.
- **Saltos en la rotación:** cuando una meta sale de la rotación, el índice salta y puede repetirse o saltarse un turno. → Se acepta, porque pasa una vez por meta.
- **Fuentes abiertas antes del despliegue:** no reciben `goal-view` y se quedan con la última meta que vieron. → Hay que actualizarlas una vez en OBS (tarea 9.3).
- **Cambio de comportamiento:** quien tuviera una meta de Twitch saliendo sola en la 0.3.0 pasa a ver la de Scaena. → Es lo que se pidió, y se dirá en las notas de la versión y en la «Guía de uso».
- **Más escrituras por evento:** cada evento que cuenta hace un `INCRBY` por meta de su tipo (como mucho 5) más una publicación. → Se acepta.

## Migration Plan

1. Desplegar. La primera lectura de cada canal migra la meta antigua (decisión 3) y borra `twitch-goal`.
2. Abrir Overlays en el estudio: se piden las metas de Twitch a Helix y quedan todas guardadas.
3. Actualizar una vez las fuentes de la meta y de las escenas en OBS.

Vuelta atrás: la 0.3.0 no lee `goals` ni `goal:<id>`, así que volvería a no tener meta guardada. Si hiciera falta, se reconstruye `goal` a partir de `goals[0]` a mano.

## Open Questions

- **¿Deja Twitch tener dos metas activas del mismo tipo?** El modelo por id funciona en los dos casos. Cambia solo cuántas opciones de Twitch salen.
