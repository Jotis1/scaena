# Proposal

## Why

Hay un diseño nuevo de Scaena aprobado en Claude Design (lienzo «Scaena», 27 pantallas, montado entero con Regula 0.8.0) que cambia la portada, la página de vídeos y el estudio, y sustituye casi todo el marcado hecho a mano por componentes del sistema. El proyecto sigue en `@jotis-me/react` 0.2.0, que no trae la mitad de esos componentes (HeaderNav, Footer, LinkCard, Pager, ProgressSteps, ScaledPreview, TransparencyGrid, ButtonUtility, NumberInput), así que hay que subir Regula y rehacer las pantallas sobre él.

## What Changes

- **BREAKING (dependencia)**: subir `@jotis-me/react` de 0.2.0 a 0.8.0 y quitar `@jotis-me/icons`. Desde 0.8 las props de icono ya no aceptan nombres (`icon="play"`) sino componentes de `@untitledui/icons` o nodos, y `Icon` desaparece. Todo el código que pasa iconos por nombre (unos 35 ficheros entre web, estudio y overlays) se migra.
- **Portada nueva**, en tres secciones en lugar de cuatro:
  1. Cabecera: qué es la web, el estado del directo (`StreamStatus`), el lema, dos botones («Ver en Twitch» o «Entrar al directo», y «Ver los vídeos») y un `BrowserFrame` con lo que se vería en Twitch en ese momento (la escena offline, o la escena de juego si hay directo).
  2. «Cómo va un directo»: cuatro pasos pulsables con `ProgressSteps` (antes, la partida, la charla, después), cada uno con su escena real y dónde pasa (Twitch, YouTube o Discord).
  3. «Lo último en YouTube»: los tres últimos vídeos como `LinkCard` y «Ver todos los vídeos».
  - **BREAKING (contenido)**: desaparecen «Ajustes de partida», «Cuándo suelo estar», «Dónde verlo» y «Diario de partidas».
- **Cabecera y pie de la web** con `HeaderNav` (Inicio, Vídeos, botón de tema) y `Footer` (columnas «El canal» y «Esta web»). El icono de app pasa a `AppIcon app="scaena"`.
- **Aviso de directo** más corto: `Banner` de marca con «En directo: título», «categoría, tiempo en emisión» y «Ver en Twitch» en sus acciones. Ya no lleva los espectadores ni el enlace `/live` en el aviso.
- **Página de vídeos**: `PageHeader` con las pestañas dentro, el vídeo que suena arriba (sigue siendo clic para cargar), la rejilla de `LinkCard` sin repetir el vídeo que suena, y `Pager` («Más recientes» y «Anteriores») en lugar de `Pagination`. Carga con `Skeleton`, y vacío y error con `EmptyState`.
- **Estudio**:
  - Entrada: tarjeta centrada con el icono, «Entra en el Estudio» y el aviso de cuenta sin acceso dentro de la tarjeta.
  - Armazón: `SidebarNav` y `PageHeader` con el botón de tema en las acciones. Desaparece la barra superior con migas.
  - Overlays: arriba, las tarjetas «Token de los overlays» y «Alertas de prueba»; debajo, las fuentes repartidas en dos pestañas, «Piezas» (6) y «Escenas» (6). Cada fuente es una tarjeta con `CardHeader`, vista previa con `ScaledPreview` sobre `TransparencyGrid` oscuro, sus opciones y la URL en un `Input` con el botón de copiar dentro. Las frases de alerta pasan a la tarjeta de «Alertas». Rotar el token sigue pidiendo confirmación con `Modal`.
  - Recursos y conexión: la misma información, con `CardHeader`, `SectionHeader`, `EmptyState` y `Table` como en el diseño.
- **Perfil del canal**: añade los textos nuevos (la frase de qué es la web, los cuatro pasos de «Cómo va un directo» y la línea del pie) y quita «Ajustes de partida». Los textos que el diseño ha reescrito (panel «Vídeos», tercera norma, descripción) se toman del diseño.
- Overlays de OBS, banner y paneles de Twitch: el diseño no los cambia. Solo se migran los iconos y se comprueba que siguen igual.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `channel-site`: cambian «Portada del canal», «Aviso de directo», «Página de vídeos», «Diseño de la suite» y «Enlace corto al directo» (el ancla del horario). Se quita «Ajustes de partida sin controles».
- `channel-profile`: «Contenido del canal en un solo sitio» y «Sin emojis en los textos» dejan de nombrar los ajustes de partida e incluyen los textos nuevos de la portada. «Horario habitual» y «Enlaces opcionales» se ajustan a dónde sale ahora el horario (junto al estado, en la portada) y a dónde sale Discord (pie y paso «Después»).
- `obs-overlays`: «Página de URLs para copiar» reparte las fuentes en «Piezas» y «Escenas» y añade el botón de copiar dentro de la URL.

## Impact

- **Dependencias**: `@jotis-me/react` 0.8.0 (trae `@jotis-me/tokens` 0.8.0 y `@untitledui/icons`). Sale `@jotis-me/icons`. Puede que haga falta `@jotis-me/assets` para los logos de Twitch, YouTube y Discord si sustituyen a `components/brand/SocialLogo.tsx`.
- **Código**: `app/(web)/**` (portada, vídeos, estudio), `components/web/**` (se borran `home/WhoPlays`, `home/WhenAndWhere`, `home/GameDiary`, `home/LiveBadge`, `VideoCard`, `videos/VideoPagination`, `SiteNav`), `components/studio/**` (se borra `StudioTopBar` y se rehace `OverlaySources`), los iconos de `components/overlay/**`, `lib/profile/**` (esquema y validación), `content/channel.yaml` y `app/favicon.svg/route.ts`.
- **Pruebas**: e2e de portada, vídeos y estudio (`e2e/*.spec.ts`), tests del perfil y la comparación visual de los overlays.
- **OpenSpec**: los requisitos que se modifican viven todavía en el cambio `create-scaena`, sin archivar (`openspec/specs/` está vacío). Hay que archivar `create-scaena` antes que este cambio para que los deltas encuentren sus requisitos.
- Las rutas, la API, los parámetros de los overlays y los datos guardados no cambian.
