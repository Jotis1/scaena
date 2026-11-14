# Proposal

## Why

Al revisar la web y el estudio ya montados sobre Regula 0.8 salen varios ajustes. La navegación de la cabecera parece un grupo de pestañas resaltadas y no va a todo el ancho. El marco de la portada se queda pequeño. El contenido del estudio va pegado a la izquierda. El botón de tema cambia de icono al pulsarlo y no deja volver a «seguir al sistema». Y no hay forma de buscar un vídeo concreto. Además, quien emite en un monitor ultrapanorámico necesita las escenas en 3440×1440: hoy solo existen a 1920×1080.

## What Changes

- **Cabecera de la web**: `HeaderNav` pasa de `simple` a `underline` y va a todo el ancho (`fullWidth`). «Inicio» y «Vídeos» se marcan subrayados, no resaltados.
- **Buscador de vídeos y directos** en la cabecera de la web, en todas las páginas. Busca por título y por juego, y lleva a `/videos?q=…` con los resultados. Se combina con las pestañas «Todos», «Directos» y «Editados» y con la paginación, y sin resultados enseña un estado vacío propio.
- **Selector de tema en desplegable**, con «Claro», «Oscuro» y «Sistema». El botón tiene siempre el mismo ancho, para que la cabecera no se mueva al cambiar. En la web va a la izquierda del buscador; en el estudio, en la cabecera de cada página, como ahora. «Sistema» borra la elección guardada y vuelve a seguir la preferencia del sistema. **BREAKING (comportamiento)**: el botón de un clic que alternaba claro y oscuro desaparece.
- **Marco de la portada más grande**: el `BrowserFrame` de la primera sección pasa de unos 340 px a ocupar su media columna en escritorio (hasta 640 px) y todo el ancho en móvil.
- **Estudio centrado**: el contenido de cada página va centrado en el espacio que deja la barra lateral, con su ancho máximo.
- **Escenas en 3440×1440**: las seis escenas (juego, Just Chatting, empezando, vuelvo enseguida, final y offline) aceptan `canvas=3440x1440`. Sin el parámetro siguen a 1920×1080, igual que ahora. En el estudio, la pestaña «Escenas» deja elegir el lienzo, y la vista previa y la URL lo reflejan.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `channel-site`: «Diseño de la suite» (navegación subrayada a todo el ancho, buscador en la cabecera), «Claro y oscuro» (desplegable con «Sistema» y ancho fijo) y «Página de vídeos» (búsqueda por `q`). Se añade «Buscador de vídeos».
- `obs-overlays`: «Lienzo de emisión» (segundo lienzo de 3440×1440), «Escenas montadas» (reparto en ultrapanorámico) y «Página de URLs para copiar» (elegir el lienzo de las escenas).

## Impact

- **Dependencias**: `@jotis-me/react` sube a `^0.8.1`, que trae `StreamScene` con `width` (escenas de pantalla completa anchas, con el pie de lado a lado) y `HeaderNav` con `mobileActions` (el selector de tema también en la fila móvil).
- **Código web**: `components/web/SiteHeader.tsx`, `ThemeToggle.tsx` (pasa a `ThemeMenu`), un buscador nuevo en `components/web/`, `components/web/home/Hero.tsx`, `app/(web)/(site)/videos/page.tsx`, `lib/youtube/videos.ts` (filtro por texto) y `public/theme-init.js`, que se queda igual pero se revisa con «Sistema».
- **Estudio**: `app/(web)/studio/(app)/layout.tsx` (centrado), `components/studio/OverlaySources.tsx` (selector de lienzo) y `lib/studio/overlay-urls.ts` (`canvas` en la URL de las escenas).
- **Overlays**: `components/overlay/scenes/layouts.tsx` (ancho lógico configurable), las páginas de escena en `app/(overlay)/overlay/[channel]/scene/**` y `lib/overlay/params.ts`.
- **Pruebas**: e2e de la web (`site`, `videos`, `theme`), del estudio y de las escenas (`scenes`, `mounted-scenes`, `overlay-layout`), con referencias visuales nuevas para 3440×1440.
- Sin cambios en la API, la autenticación ni los datos guardados. Las URL que ya están en OBS siguen funcionando igual.
