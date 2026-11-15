# Proposal

## Why

Al usar la 0.4.0 han salido varios detalles del estudio que se ven mal o no dicen lo que pasa:

- En Overlays, la pestaña elegida de «Piezas / Escenas» se sale del marco por la derecha.
- En Conexión, la cuenta sale con la inicial («J») en lugar de la foto de Twitch, que la cabecera sí enseña.
- Al cambiar «Qué meta sale», la rotación o el intervalo, el control solo se deshabilita mientras guarda: no se sabe si está guardando ni si ha salido bien.
- La lista vertical de piezas y escenas de Overlays usa pestañas de fondo gris, y queremos que sea de tipo línea, como la navegación de dentro de una página.
- **El aviso «Falta un permiso de Twitch» no se va nunca.** Al volver a entrar con Twitch, better-auth renueva el token pero no actualiza los permisos guardados de la cuenta: lo hace a propósito y solo los cambia `linkSocial`. Scaena los lee de ahí, así que sigue creyendo que falta el permiso de metas aunque el token ya lo tenga y las suscripciones de metas estén activas.
- El pie de la web se ha quedado atrás: «Esta web» tiene «Inicio» y «Vídeos», pero no «Estudio», que la cabecera enseña siempre.
- La barra lateral empieza con «Estudio · Overlays», que repite lo que ya dicen la cabecera («Estudio», marcada) y el título de la página.
- El aviso, y algún texto más, cuentan novedades («Scaena ahora pide…», «un permiso nuevo»). Antes de la beta no hay usuarios a los que contarles qué ha cambiado: los textos tienen que decir cómo están las cosas, no qué ha cambiado.

## What Changes

- **Pestañas «Piezas / Escenas»:** la columna de la izquierda de Overlays pasa a tener 240 px como poco (antes 220). Con menos, «Piezas 6» y «Escenas 6» no caben con su marco y «Escenas» se sale 2 px. Ya está hecho en el árbol, con una prueba e2e que mide los 4 px de marco por cada lado.
- **Foto de perfil en Conexión:** la tarjeta «Cuenta conectada» enseña la foto de la cuenta de Twitch de la sesión. La inicial queda solo para cuando Twitch no da foto.
- **Estado al guardar la meta:** al elegir otra meta, rotar, marcar o desmarcar metas, cambiar «Al cumplirse» o el intervalo:
  - el cambio se ve al momento en el estudio (actualización optimista);
  - junto al selector sale un indicador de carga con «Guardando…» y, al acabar, «Guardado» o el error;
  - si falla, vuelve a lo que había.
- **Pestañas de las fuentes:** la lista vertical de piezas y escenas de Overlays pasa a `type="line"`.
- **Pie al día:** «Esta web» añade «Estudio», que lleva a Overlays con sesión y a la entrada sin ella, como en la cabecera.
- **Barra lateral sin título:** se quita «Estudio · <sección>». La barra lateral empieza directamente con las secciones. En el móvil, el botón que la abre queda solo.
- **Permisos de verdad:** los permisos de la sesión se piden a Twitch con el token actual (`GET https://id.twitch.tv/oauth2/validate`), en lugar de leer la lista guardada. Si Twitch no contesta, no se avisa de nada (sin falsas alarmas).
- **Textos sin novedades:** el aviso pasa a «Para ver tus metas de Twitch hace falta un permiso que tu sesión no tiene. Vuelve a entrar con Twitch y después pulsa «Conectar eventos».», y la guía, a «Si Conexión dice que falta un permiso, vuelve a entrar con Twitch.».
- Versión 0.4.1 (arreglo).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `obs-overlays`: un requisito nuevo, «Estado al guardar qué meta sale».
- `channel-site`: «Navegación del estudio» cambia: la barra lateral no repite un título con el estudio ni la sección. «Diseño de la suite» cambia: el pie lleva «Estudio».
- `twitch-events`: un requisito nuevo, «Cuenta conectada con su foto», y «Conexión del canal» cambia: los permisos que faltan se miran con el token actual de Twitch, y volver a entrar quita el aviso.

Las pestañas de «Piezas / Escenas» y de las fuentes no cambian ningún requisito: son de diseño y quedan en `design.md`.

## Impact

- `components/studio/OverlaySources.tsx`: la columna de 240 px (ya hecho) y `type="line"` en las pestañas «Fuentes».
- `components/studio/ConnectionView.tsx` y `app/(web)/studio/(app)/connection/page.tsx`: pasar la foto de la sesión a `AvatarLabel`.
- `components/studio/overlays/GoalManager.tsx`: estado optimista, `Spinner` y mensaje de estado.
- `components/studio/StudioSidebar.tsx`: sin `brand`. `components/web/SiteFooter.tsx` y `app/(web)/(site)/layout.tsx`: «Estudio» en el pie, con el destino según la sesión.
- `lib/studio/session.ts` y `lib/twitch/server.ts`: los permisos, de `validate` con el token de `getAccessToken`. `components/studio/ScopeNotice.tsx` y `components/studio/guide/UsageSections.tsx`: los textos.
- e2e: `e2e/studio.spec.ts`, con la prueba de las pestañas (ya hecha), la de la foto en Conexión y la del estado al guardar.
- Sin cambios en la API ni en los datos.
