## 1. Perfil asíncrono con cambios guardados

- [x] 1.1 Añadir el modelo `ChannelProfile` (`login` como id, `data Json`, `updatedAt`) a `prisma/schema.prisma` y crear la migración `channel_profile`.
- [x] 1.2 Crear `loadProfile(login)` y `loadMainProfile()` en `lib/profile/index.ts`:
  - Envueltas en `cache()`.
  - Parten del YAML y le ponen encima `data`.
  - Validan con `profileSchema`.
  - Si algo falla, quitan los campos de primer nivel que fallan y devuelven `invalidFields`.
- [x] 1.3 Probar la fusión: sin datos sale el YAML, un cambio de normas se aplica y unas normas que ya no valen vuelven a las del YAML con `invalidFields: ["rules"]`.
- [x] 1.4 Pasar los 33 usos de `getProfile`/`getMainProfile` a `await loadProfile`/`loadMainProfile`. Afecta a layouts, páginas, rutas, `lib/site.ts`, `lib/channel.ts`, `lib/metadata.ts`, `lib/overlay/channel.ts` y `SiteFooter`. Después, quitar las funciones síncronas.
- [x] 1.5 Crear `PUT /api/studio/profile` y `DELETE /api/studio/profile`:
  - Ambas exigen sesión y que el canal de la sesión sea el del perfil.
  - PUT solo acepta las claves editables, contesta 422 con `fields` usando las rutas de zod, y si todo vale guarda y devuelve el perfil.
  - DELETE borra lo guardado.
- [x] 1.6 Probar la API: sin sesión da 401, una norma con emoji da 422 con `rules.N`, no se puede cambiar `twitch.login`, guardar funciona y DELETE vuelve al YAML.

## 2. Cabecera, cuenta y barra lateral

- [x] 2.1 Sacar la lógica del tema de `ThemeMenu` a un hook `useTheme()`. `ThemeMenu` pasa a usarlo.
- [x] 2.2 Crear `components/web/AccountMenu.tsx`:
  - Un `Dropdown variant="account-avatar"` con un `AvatarLabel` en la cabecera.
  - La sección «Tema» con tres opciones.
  - Un divisor y «Cerrar sesión», que llama a `authClient.signOut()` y luego a `router.replace("/")` y `router.refresh()`.
  - Sin `id` fijos.
- [x] 2.3 Cortar antes en `readSession` cuando no hay cookie de sesión (`getSessionCookie`).
- [x] 2.4 Que `SiteHeader` reciba `account?`:
  - «Estudio» siempre, actual en `/studio/*`, con `href` a overlays si hay sesión o a login si no.
  - Sin hijos.
  - A la derecha, `AccountMenu` con sesión y `ThemeMenu` sin ella.
- [x] 2.5 Leer la sesión en el layout `(site)` y en el del estudio, y pasarla a `SiteHeader`.
- [x] 2.6 Cambiar `StudioSections` por `StudioSidebar`:
  - `SidebarNav type="simple" responsive`, con los iconos de cada sección y la actual marcada.
  - Sin cuenta.
- [x] 2.7 Montar el layout del estudio como rejilla: cabecera arriba, barra lateral a la izquierda y `<main>`. La franja de aviso va dentro de `<main>`.
- [x] 2.8 En `STUDIO_PAGES`, cambiar «Guía de OBS» por «Guía de uso» y actualizar los textos y metadatos que la nombran.
- [x] 2.9 Actualizar las pruebas de componentes de cabecera, cuenta y barra lateral:
  - «Estudio» sin sesión lleva a `/studio/login`.
  - Con sesión hay avatar y no hay `ThemeMenu`.
  - Elegir «Oscuro» en el menú de la cuenta cambia el tema.

## 3. Overlays: URL, token y selector de lienzo

- [x] 3.1 Reproducir el selector de lienzo sin relleno con capturas a 1280 y 390 px, encontrar la causa y arreglarla según la decisión 4. Si es de Regula, apuntarla.
- [x] 3.2 Partir lo que devuelve `sourceUrl` en origen y resto, con una prueba unitaria.
- [x] 3.3 Cambios en `SourceUrl`:
  - `Input` deshabilitado, con `prefix` del origen y sin `font-mono`.
  - «Copiar»/«Copiada» como `Button` al lado del campo, con salto de línea en el móvil.
- [x] 3.4 En `TokenField`, `Input` deshabilitado y «Rotar» como `Button` aparte. El `Modal` no cambia.
- [x] 3.5 Prueba de componente: en Overlays, todo `input` cuyo valor lleve `•` está deshabilitado, y «Copiar» y «Rotar» siguen activos.
- [x] 3.6 Cambiar `router.replace` por `history.replaceState` en el cambio de lienzo y de fuente de Overlays, y comprobar que `?source=&canvas=` se conserva.

## 4. Opciones de cada pieza en las escenas

- [x] 4.1 Que `sceneOptions` acepte `animate`, `message`, `rows`, `viewers` y `name`, con los mismos valores por defecto y la misma tolerancia que las piezas sueltas. Probarlo, incluido `rows=abc`.
- [x] 4.2 Que `GameScene` y `ChattingScene` pasen esas opciones al chat, las alertas, los eventos, el estado y el marco de cámara.
- [x] 4.3 Que `sourceUrl` emita esas opciones para `scene/game` y `scene/chatting` solo cuando no son el valor por defecto, con pruebas.
- [x] 4.4 Sacar las opciones de `OverlaySources` a componentes por pieza: `ChatOptions`, `AlertOptions`, `EventOptions`, `GoalOptions`, `StatusOptions` y `CameraOptions`. La pieza suelta los usa.
- [x] 4.5 Crear `ScenePieceBlock`, con título, `Toggle` si la pieza es opcional y sus opciones. Montar los bloques de juego y Just Chatting en un `Accordion` con «Meta» abierto. Las vistas previas de escena reflejan las opciones.
- [x] 4.6 Probar en el navegador:
  - Con 3 filas de eventos, la URL lleva `rows=3`.
  - Guardar la meta desde Just Chatting la guarda.
  - Encender «Enseñar espectadores» pone `viewers=1`.

## 5. Meta de Twitch

- [x] 5.1 Añadir `channel:read:goals` a `TWITCH_SCOPES` y su descripción a `SCOPE_DESCRIPTIONS`. En Conexión:
  - Comparar `Account.scope` con los permisos que hacen falta.
  - Enseñar la alerta de permiso que falta, con «Volver a entrar con Twitch».
- [x] 5.2 Añadir `channel.goal.begin`, `channel.goal.progress` y `channel.goal.end` a `SUBSCRIPTIONS`, con sus textos en `SUBSCRIPTION_LABELS` y `CONSEQUENCE`. Revisar que `conditionFor` y la vista de Conexión sirven con 11.
- [x] 5.3 `normalize` traduce los avisos de meta a `{ kind: "goal", phase, goal }` y los tipos de Twitch a tipo y unidad de Scaena, según la tabla de la decisión 6. Pruebas con fixtures de los tres avisos y de `new_cheerer`.
- [x] 5.4 Crear `lib/alerts/twitch-goal.ts` con `readTwitchGoal`, `saveTwitchGoal` y `clearTwitchGoal(id)`. Este último solo borra si el id coincide.
- [x] 5.5 Crear `lib/alerts/goal-source.ts` con `resolveGoal`. `GoalState` lleva `source`.
- [x] 5.6 Usar `resolveGoal` en `initialEvents`, `saveGoal` y `countGoalEvent`. Este último sigue sumando a Scaena pero solo publica sin meta de Twitch. Probar que la meta de Twitch manda, que al acabar vuelve la de Scaena y que un progreso repetido no suma dos veces.
- [x] 5.7 Que el webhook trate `kind: "goal"` después del paso que quita duplicados (guardar o borrar, y luego publicar), con pruebas firmadas.
- [x] 5.8 Sembrar la meta: `fetchTwitchGoal(userId, channelId)` con `getAccessToken` y `GET /helix/goals`, y 2 s como máximo.
  - Si Twitch no responde, conserva la meta que había.
  - Si hay varias metas, se queda con la más reciente.
  - Si no hay ninguna, borra la guardada.

  Se llama al conectar eventos y al cargar Overlays, sin bloquear la página.
- [x] 5.9 En `GoalOptions`:
  - Con `source === "twitch"`, un `Alert` que diga que sale la meta de Twitch y que se cambia en Twitch.
  - El editor de la meta de Scaena, con el hint «Se usa cuando no hay meta en Twitch».
- [x] 5.10 e2e: un aviso firmado de `channel.goal.progress` cambia la pieza de meta abierta, y `channel.goal.end` vuelve a la meta guardada.

## 6. Guía de uso

- [x] 6.1 Pasar la parte de la guía que depende del lienzo a `GuideBody`, un componente de cliente con el lienzo en estado. `GuideCanvasPicker` cambia la URL con `history.replaceState` y conserva el hash.
- [x] 6.2 Escribir las secciones «Cómo funciona», «Lo que hay que hacer a mano» (con enlace a Conexión) y «Trucos de OBS» (cámara con y sin filtro, con el grupo), y añadirlas al índice.
- [x] 6.3 Cambiar «Guía de OBS» por «Guía de uso» en los títulos, `metadata`, el enlace «Cómo montarla en OBS» y las pruebas.
- [x] 6.4 e2e:
  - Al pulsar «3440 × 1440», la cámara de juego pasa a «2.864, 1.088» sin petición a la página.
  - `/studio/guide?canvas=3440x1440#game` abre con ese lienzo.
  - Las tres secciones nuevas aparecen en el índice.

## 7. Editor del perfil en Recursos

- [x] 7.1 Recursos carga `loadProfile` con `invalidFields`, y avisa con un `Alert` si alguno no vale.
- [x] 7.2 Crear `ProfileEditor`: un `Accordion` con los bloques «Lema y descripción», «Horario», «Redes», «Normas», «Paneles» y «Banner». El borrador vive en el estado del cliente, y los paneles que toman su texto de otra parte dicen de dónde.
- [x] 7.3 Que la vista previa de `ProfileAssets` use el borrador, con `panelsOf` y `bannerOf` en el cliente. El zip y los PNG salen de lo que se ve.
- [x] 7.4 «Guardar» llama a `PUT` y pone cada error de `fields` en su campo. «Volver a los valores por defecto» pide confirmación con un `Modal` y llama a `DELETE`. Mensajes de estado con `role="status"`.
- [x] 7.5 e2e:
  - Se cambia la tercera norma, se guarda, se recarga y el panel «Normas» la enseña.
  - La portada enseña el horario nuevo después de guardarlo.
  - Una norma con emoji da su error en el campo.
  - Volver a los valores por defecto vuelve al YAML.

## 8. Specs, comprobaciones y versión

- [x] 8.1 Actualizar los e2e de navegación del estudio (barra lateral, menú en el móvil y que no haya otra barra horizontal) y de la cabecera pública («Estudio» y menú de la cuenta), con axe sin fallos en las páginas tocadas.
- [x] 8.2 Pasar `bun run lint`, `check:colors`, `tsc`, las pruebas unitarias, los e2e en serie con la base de datos de Docker y `openspec validate --strict`.
- [x] 8.3 Subir la versión a 0.3.0 en `package.json`, abrir la PR, mergear en `main` y crear y subir la etiqueta anotada `v0.3.0`.
- [ ] 8.4 Después del despliegue, avisar de que hay que volver a entrar con Twitch y pulsar «Conectar eventos» para las metas.
