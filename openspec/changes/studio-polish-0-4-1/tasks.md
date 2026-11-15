## 1. Pestañas «Piezas / Escenas»

- [x] 1.1 Pasar la columna de la izquierda de Overlays a `flex-[1_1_240px]`, con el comentario de la cuenta, y añadir la prueba e2e de los 4 px de marco por cada lado.

## 2. Foto en Conexión

- [x] 2.1 Que `ConnectionView` y `ConnectionUnreachable` reciban `image?` y lo pasen a `AvatarLabel` como `src`, con la inicial de respaldo; la página de Conexión les pasa `session.image`.
- [x] 2.2 e2e: con foto en la cuenta, Conexión enseña la imagen en «Cuenta conectada» y no la inicial.

## 3. Estado al guardar la meta

- [x] 3.1 Sacar a `lib/alerts/goal-pick.ts` una función pura `viewOf(goals, twitchGoals, show, done, now)` con la regla de `goalOverview`, y que el servidor la use. Mismos tests en verde y uno más de la función.
- [x] 3.2 En `GoalManager`, guardar el estado optimista `pending`: pintarlo al momento en el selector, la rotación y la vista previa (con `viewOf`); un contador de petición para aplicar solo la última respuesta; volver a lo que había si falla.
- [x] 3.3 Junto al selector, `Spinner` y «Guardando…» (`role="status"`) mientras guarda; «Guardado» al acabar, que se va a los 2 s; el error en `role="alert"`. El botón de borrar una meta, con `loading`.
- [x] 3.4 e2e: elegir otra meta enseña «Guardando…» y luego «Guardado», con el selector ya cambiado; con el `PUT` interceptado para que falle, el selector vuelve a la meta de antes y sale el error.

## 4. Pestañas de las fuentes

- [x] 4.1 `type="line"` en las pestañas verticales «Fuentes» de Overlays; revisar las capturas a 1440 y a 390 px, en claro y oscuro.

## 4b. Barra lateral

- [x] 4b.1 Quitar `brand` de `StudioSidebar` y actualizar su test y el comentario. e2e: la barra lateral no enseña «Estudio · Overlays». Revisar las capturas a 390 px.

## 4c. Pie

- [x] 4c.1 «Estudio» en la columna «Esta web» de `SiteFooter`, con `/studio/overlays` o `/studio/login` según la sesión (el layout se la pasa). Test del componente y actualizar el e2e del pie.

## 5. Permisos y textos

- [x] 5.1 `missingScopesFor`: el token con `getAccessToken`, `validate` con 2 s y `[]` ante cualquier fallo; con `fetch` inyectable y tests (falta uno, no falta ninguno, 401, error de red). Conexión lo usa y `StudioSession.scopes` desaparece.
- [x] 5.2 Textos: el aviso de `ScopeNotice` y la línea de la guía, sin «ahora» ni «nuevo». Buscar en `app`, `components` y `lib` otros textos que anuncien novedades y cambiarlos.
- [x] 5.3 e2e: en Conexión no sale el aviso de permisos cuando Twitch no contesta (en las pruebas no hay Twitch para `validate`; los casos con respuesta los cubren los tests de 5.1).

## 6. Versión

- [x] 6.1 Pasar los tests unitarios y e2e, Biome, `check:colors`, `tsc`, el build y `openspec validate --strict` del cambio.
- [x] 6.2 Subir la versión a 0.4.1 en `package.json`, abrir la PR, mergear en `main` y crear y subir la etiqueta anotada `v0.4.1`.
