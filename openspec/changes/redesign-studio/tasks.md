# Tasks

El diseño es el canvas «Scaena - Studio» (artefacto `4f8b41ee-4210-43ab-9ab8-09bb479386e3`). Las e2e se ejecutan en serie y necesitan el Postgres de Docker (`scaena-e2e-db`). Antes de cada grupo, leer las pantallas del canvas que le tocan.

## 1. Reglas compartidas

- [x] 1.1 `PHRASE_HOLES` y `phraseError(type, text)` en `lib/alerts/phrase.ts`; `saveSettings` valida por tipo y `readSettings` sigue con el esquema global (design.md, decisión 5). Verificar con tests en `lib/alerts/settings.test.ts` «Hueco de otra alerta» (bits con `{bit}`, follow con `{meses}`: error de campo que lista los huecos válidos), que una frase vieja de follow con `{meses}` guardada a mano se sigue leyendo, y un test de que las seis frases de `content/channel.yaml` cumplen la regla
- [x] 1.2 `GOAL_LABELS` con «Meta de subs/seguidores/bits» y `GOAL_UNITS`; `LiveGoal`, `DEFAULT_GOAL` y las vistas previas usan `unit ?? GOAL_UNITS[type]` (design.md, decisión 6). Verificar con `bun run test` y con las e2e de meta de `live-overlays.spec.ts` y `studio.spec.ts`, ajustadas a los textos nuevos
- [x] 1.3 `lib/studio/connection.ts`: qué alimenta cada suscripción («Alertas, eventos y meta», «Alertas y eventos», «Estado») y la cuenta de activas. Verificar con tests en `lib/studio/connection.test.ts`

## 2. Armazón y navegación

- [x] 2.1 `SiteHeader` con `studio?: { name }`: añade «Estudio» actual con sus cuatro secciones como `children`; sin él, nada cambia (design.md, decisión 1). Verificar en `e2e/studio.spec.ts` (que ya abre sesión) que la portada, con una sesión del estudio abierta, no enseña «Estudio» («La web no cambia»)
- [x] 2.2 `StudioSections` (pestañas con `href`, cuenta y «Salir») y `StudioContent` (1280 px); el layout del estudio los usa y se borra `StudioSidebar`. Verificar en `e2e/studio.spec.ts` «Cambiar de sección», «Cuenta y salida a la vista», «Estudio en el móvil» (390 px, sin desplazamiento horizontal), que «Salir» cierra la sesión, que el contenido sigue centrado a 1920 px con 1280 de máximo y que no queda ninguna `nav` lateral
- [x] 2.3 `EventsNotice` como franja a todo el ancho bajo la navegación, en Overlays, Guía y Recursos, y no en Conexión (design.md, decisión 3). Verificar con `components/studio/EventsNotice.test.tsx` (en las e2e no hay Twitch, así que el aviso no sale allí): la franja con «Eventos sin conectar» y «Conectar eventos», y que Overlays, Guía y Recursos la ponen antes de su contenido y Conexión no; los escenarios de textos siguen en `lib/studio/connection.test.ts`

## 3. Overlays

- [x] 3.1 Registro de fuentes `components/studio/overlays/sources.tsx` y `OverlaySources` en lista y detalle, con la elección en `?source=&canvas=`, `?tab=scenes` → `game` y escenario medido; se borra `SourceCard` (design.md, decisión 2). Verificar en `e2e/studio.spec.ts` «Copiar URL configurada», «Cambiar a escenas», «Escenas en ultrapanorámico», «Copiar una URL», «Enlace antiguo a la pestaña de escenas» y «Enlace desde Overlays», y que `axe` no da errores en una pieza y en una escena
- [x] 3.2 `TokenField` en la cabecera, con «Rotar» y el `Modal`; se borra `TokenCard` (design.md, decisión 4). Verificar en `e2e/studio.spec.ts` «Token en la cabecera» y que las pruebas de rotar el token (cancelar y rotar) pasan con el campo nuevo
- [x] 3.3 `PhraseEditor` con una fila por tipo (botón de prueba y frase), pista con «Ahora dice», errores por tipo mientras se escribe, «Guardar frases» desactivado con errores y vista previa del último tipo; se borra `TestAlertsCard`. Verificar en `e2e/studio.spec.ts` «Probar una alerta» (con el mensaje «Prueba enviada a OBS: Raid de 1.284.» y la alerta en el overlay abierto en otra pestaña), «Hueco de otra alerta» y que una frase guardada se mantiene al recargar
- [x] 3.4 `GoalEditor` con `NumberInput`, botón primario y la maqueta del detalle «La meta». Verificar con las e2e de la tarjeta de la meta adaptadas al detalle (`?source=goal`): guardar, recargar y objetivo 0

## 4. Guía de OBS

- [x] 4.1 `ButtonGroup` del lienzo, índice con anclas, `GuideDiagram` a partir de `boxes.ts`, números con `formatNumber`, la muestra de la máscara y los ajustes en cuatro tarjetas (design.md, decisión 7). Verificar con tests en `lib/studio/obs-guide.test.ts` (las posiciones «1.488, 816» y «2.864, 1.088», y los porcentajes del esquema de la cámara de juego: 77,5 % y 75,56 % en 1920) y en `e2e/studio.spec.ts` «Medidas de la escena de juego», «Medidas en ultrapanorámico» e «Índice de la guía», con `axe` sin errores

## 5. Recursos, Conexión y Acceso

- [x] 5.1 Recursos con «Descargar todo (.zip)» en la cabecera y un `article` por panel. Verificar en `e2e/assets.spec.ts` que el zip y cada PNG se siguen descargando con su nombre
- [x] 5.2 Conexión con la tarjeta de cuenta, la barra de suscripciones activas, «Alimenta», los permisos explicados y «Volver a intentar» (design.md, decisión 8), sin `render` en la tabla. Verificar con los tests de `ConnectionView.test.tsx` adaptados (también «a la tabla no le llegan funciones») y que el estado de error enseña «Volver a intentar»
- [x] 5.3 Acceso en tarjeta, con «Entrar con Twitch», «Probar con otra cuenta» y «Vuelve a la web del canal». Verificar en `e2e/studio-login.spec.ts` que los cuatro tests siguen pasando con el enlace de vuelta

## 6. Integración

- [x] 6.1 `bun run ci`, `bun run test:e2e` y `openspec validate redesign-studio --strict` en verde
- [x] 6.2 Capturas con `E2E_SHOTS` de Overlays (pieza y escena), Guía, Recursos, Conexión y Acceso, en escritorio y a 390 px, en claro y oscuro, comparadas con el canvas. Verificarlo con el visto bueno del usuario
