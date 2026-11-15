# Proposal

## Why

Hay un diseño nuevo del estudio aprobado (canvas «Scaena - Studio»: Overlays, Guía de OBS, Recursos, Conexión y Acceso, en escritorio, móvil y tema claro). El estudio actual apila doce tarjetas en dos pestañas, con el token y las alertas de prueba en tarjetas sueltas arriba, y tiene una barra lateral propia que no se parece a la web. En el diseño nuevo se trabaja con una fuente cada vez, con su vista previa grande, y la navegación es la misma cabecera de la web, con una barra de secciones debajo.

## What Changes

- **Navegación del estudio**: desaparece la barra lateral. Arriba va la cabecera de la web (Scaena, «Inicio», «Vídeos» y «Estudio» con sus secciones, tema y buscador). Debajo, una barra con las pestañas «Overlays», «Guía de OBS», «Recursos» y «Conexión», y a la derecha la cuenta con «Salir». El aviso de eventos sin conectar pasa a ir debajo de esa barra, en Overlays, Guía y Recursos. El contenido mide como mucho 1280 px. **BREAKING (interfaz)**: la barra lateral desaparece.
- **Overlays, lista y detalle**: a la izquierda, «Piezas» / «Escenas» y la lista de fuentes; a la derecha, la fuente elegida, con su título y tamaño, una vista previa grande sobre la cuadrícula de transparencia, la URL con «Copiar», una nota sobre el token, «Cómo montarla en OBS» en las escenas y sus opciones debajo. La fuente elegida y el lienzo van en la URL (`?source=game&canvas=3440x1440`). **BREAKING (interfaz)**: dejan de verse las doce tarjetas a la vez. `?tab=scenes` sigue funcionando y abre la primera escena.
- **Token en la cabecera de Overlays**: un campo de solo lectura, tapado, con «Rotar», que abre la confirmación de siempre. Desaparece la tarjeta del token.
- **Alertas de prueba dentro de «Alertas»**: cada tipo de alerta tiene su botón de prueba («Raid de 1.284»…) al lado de su frase, y la vista previa enseña la última que se ha probado o editado. Desaparece la tarjeta «Alertas de prueba».
- **Frases con huecos por tipo**: cada frase solo admite los huecos de su alerta («{meses}» en la renovación, «{cantidad}» en los regalos, «{espectadores}» en el raid y «{bits}» en los bits; follow y sub, ninguno). El error sale mientras se escribe, y «Guardar frases» se desactiva mientras haya alguna mal. El servidor valida lo mismo.
- **Meta**: los mismos campos, con «Objetivo» y «Llevas» como `NumberInput`. Los textos por defecto pasan a «Meta de subs», «Meta de seguidores» y «Meta de bits», y la unidad sale del tipo.
- **Guía de OBS**: el lienzo se elige con un `ButtonGroup`, hay un índice de la página y cada escena lleva un esquema del lienzo a escala con sus capas. La máscara tiene una muestra al lado de «Descargar máscara». Los ajustes de la fuente de navegador pasan a cuatro tarjetas. Las posiciones se escriben «1.488, 816».
- **Recursos y Conexión** con la maqueta nueva. Recursos gana «Descargar todo (.zip)» en la cabecera. Conexión enseña la cuenta con una barra «Suscripciones activas: 5 de 8», qué alimenta cada suscripción, los permisos explicados y, si Twitch falla, «Volver a intentar».
- **Acceso**: una tarjeta centrada con el icono de Scaena, «Entrar con Twitch» (o «Probar con otra cuenta» si la cuenta no tiene acceso) y «Vuelve a la web del canal».

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `channel-site`: se añade «Navegación del estudio» (la cabecera de la web y una barra de secciones, sin barra lateral; la web pública no cambia).
- `obs-overlays`: «Página de URLs para copiar» (lista y detalle, una fuente cada vez, el token en la cabecera), «Frases de alerta editables» (huecos por tipo, validación al escribir) y «Guía de montaje en OBS» (esquema a escala e índice).
- `twitch-profile-assets`: «Exportación a PNG» (los botones pasan a «Descargar» y «Descargar todo (.zip)», y cada pieza enseña el nombre de su archivo).
- `twitch-events`: «Disparo de prueba» (desde la fuente «Alertas») y «Aviso de eventos sin conectar» (debajo de la navegación, también en la Guía).

## Impact

- **Estudio**: `app/(web)/studio/(app)/layout.tsx` (sin `StudioSidebar`; la cabecera de la web y una barra de secciones nueva) y las cuatro páginas. Se reescribe `components/studio/OverlaySources.tsx` como lista y detalle. `TokenCard`, `TestAlertsCard` y `SourceCard` se sustituyen por piezas del detalle. Cambian también `PhraseEditor`, `GoalEditor`, `ProfileAssets`, `ConnectionView`, `EventsNotice` y la página de acceso.
- **Cabecera**: `components/web/SiteHeader.tsx` acepta la entrada «Estudio» con sus secciones; la web pública no cambia.
- **Validación**: `lib/profile/schema.ts` y `lib/alerts/settings.ts`, con huecos por tipo de alerta; `lib/alerts/goal.ts`, con los textos y unidades nuevos.
- **Pruebas**: se rehacen las e2e del estudio (`studio.spec.ts`, `studio-login.spec.ts`, `assets.spec.ts`), además de los tests de frases y meta.
- Sin cambios en los overlays ni en las URL que hay en OBS, en la API ni en los datos guardados. Las frases ya guardadas con un hueco de otro tipo se siguen leyendo; solo se rechazan al volver a guardar.
