## 1. Almacenamiento

- [x] 1.1 Añadir `hdel` a `Store` (`lib/storage/types.ts`), con su versión de Upstash (`redis.ts`) y la de memoria (`memory.ts`), y sus tests.
- [x] 1.2 En `lib/redis/keys.ts`, añadir `goal:<goalId>` (validando `/^[a-z0-9]{8}$/`), `goal-done` y `twitch-goals`. Dejar `goal` y `twitch-goal` como claves antiguas, solo para la migración.

## 2. Metas de Scaena

- [x] 2.1 En `lib/alerts/settings.ts`, cambiar `goal` por `goals` (de 0 a 5, con `id`), `show` (`one` o `rotate`, con `every` y `items[{ref, whenDone}]`) y `endedTwitch`. Que `saveSettings` (las frases) conserve los tres campos.
- [x] 2.2 Escribir `readGoals`, con la migración de la meta antigua y su cuenta (`set nx` y borrar la clave antigua) y el borrado de `twitch-goal`. Tests de la migración, incluida la de dos lecturas a la vez.
- [x] 2.3 Escribir `saveGoal`, que crea (con un máximo de 5) o edita y conserva o fija la cuenta como hoy, y `deleteGoal`, que da error con una sola meta y borra la cuenta y su entrada de `goal-done`. Al guardar, ajustar `goal-done` según la cuenta y el objetivo. Tests.
- [x] 2.4 Que `countGoalEvent` sume a cada meta del tipo del evento y apunte en `goal-done` la que cruza su objetivo. Tests: dos metas del mismo tipo, una meta que no sale y el paso por el objetivo.

## 3. Metas de Twitch

- [x] 3.1 En `lib/alerts/twitch-goal.ts`, guardar las metas en el hash `twitch-goals` (`readTwitchGoals`, `saveTwitchGoal`, `endTwitchGoal`) y apuntar en `goal-done` las que llegan a su objetivo.
- [x] 3.2 Que `endTwitchGoal`, con la meta elegida, quite `show`, guarde `endedTwitch` y la saque de la rotación (`items`).
- [x] 3.3 Cambiar el webhook (`lib/twitch/eventsub/webhook.ts`) para que trate cada aviso solo sobre su meta y publique la vista.
- [x] 3.4 Cambiar `syncTwitchGoal` por `syncTwitchGoals`, que sustituye el hash por lo que devuelve Helix, trata como final las metas elegidas que ya no están y no toca nada si Twitch falla. Actualizar a quien la llama.
- [x] 3.5 Tests: dos metas a la vez, acaba una de dos, se acaba la elegida, progreso repetido y la consulta a Helix con dos metas.

## 4. Vista de la meta

- [x] 4.1 Escribir `GoalView` y `resolveGoalView` (decisión 4 del diseño): meta fija, rotación, metas sacadas al cumplirse, «la última que salió» y la primera de Scaena por defecto. Tests de cada caso.
- [x] 4.2 Publicar el evento SSE `goal-view` (`publishGoalView`) cada vez que cambian la cuenta, los ajustes o una meta de Twitch. Enviarlo en `initialEvents` y quitar `resolveGoal` y `publishGoal`.
- [x] 4.3 Escribir `pickGoal(view, now)`, la elección por reloj con `offset`, compartida por el overlay y el estudio, y sus tests.

## 5. API del estudio

- [x] 5.1 Cambiar `/api/studio/settings`: `GET` con metas, metas de Twitch y vista; `PUT { goal }`, `DELETE ?goal=`, `PUT { show }` (validando los `ref`) y `PUT { dismissEnded }`. Tests de propiedad y de validación: 6 metas, borrar la última y un `ref` que no existe.

## 6. Overlay

- [x] 6.1 Que `lib/events/client.ts` y `ChannelEvents` escuchen `goal-view` y guarden la vista.
- [x] 6.2 Que `LiveGoal` pinte la vista, con la rotación por reloj y un fundido de 300 ms salvo sin `animate` o con `prefers-reduced-motion`, y que sin metas use la URL. Aplicarlo en la pieza y en las dos escenas. Tests.

## 7. Estudio

- [x] 7.1 Crear `components/brand/GoalSourceIcon.tsx` con el icono de Scaena (el sólido de `AppIcon`, el mismo del favicon) y el de Twitch (`SocialLogo`, en monocromo).
- [x] 7.2 Crear `GoalManager`: el selector «Qué meta sale» con iconos, el panel de «Rotar» (casillas, «Al cumplirse» e intervalo), «Tus metas» (Accordion con `GoalEditor`, «Borrar» y «Añadir meta» con sus límites), «En Twitch» de solo lectura y la alerta `endedTwitch`.
- [x] 7.3 Usar `GoalManager` en la pieza «Meta» y en el bloque «Meta» de las dos escenas, en lugar de `GoalOptions`. Que las vistas previas usen la vista y `pickGoal`. Quitar la alerta «Ahora sale tu meta de Twitch».
- [x] 7.4 En la «Guía de uso» («Cómo funciona»), explicar qué meta sale, cómo se rota y que las metas de Twitch se eligen.

## 8. Pruebas de navegador

- [x] 8.1 e2e: añadir una segunda meta, elegirla y ver que la pieza abierta cambia sin recargar; no poder añadir una sexta ni borrar la última; ver los iconos del selector.
- [x] 8.2 e2e: con dos metas de Twitch (avisos `GOAL_BEGIN` de dos ids), elegir una; un progreso de la otra no la cambia; al acabar la elegida sale la de Scaena y el estudio lo avisa.
- [x] 8.3 e2e: rotar dos metas cada 10 s (con el reloj real: la corrección con la hora del servidor anula uno falso) y ver que la pieza y la escena coinciden; «Sacar de la rotación» al cumplirse; axe sin errores en el panel de la meta.

## 9. Versión

- [x] 9.1 Pasar los tests unitarios y e2e, Biome, `check:colors`, `tsc`, el build y `openspec validate --strict` del cambio.
- [x] 9.2 Subir la versión a 0.4.0 en `package.json`, abrir la PR, mergear en `main` y crear y subir la etiqueta anotada `v0.4.0`.
- [x] 9.3 Después del despliegue, avisar de que hay que actualizar una vez las fuentes de la meta y de las escenas en OBS y de abrir Overlays para que se carguen las metas de Twitch.
