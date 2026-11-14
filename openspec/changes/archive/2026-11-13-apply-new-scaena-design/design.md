# Design

## Context

- Fuente del diseño: el lienzo «Scaena» de Claude Design (`https://claude.ai/artifact/EFkjaMXCtS4oeMmatHWtRV`), con el sistema de diseño Jotis.me (Regula 0.8.0) instalado. Tiene 27 pantallas en cinco grupos: A, la web (portada, portada en directo, vídeos con contenido, vacío, carga y error, y móvil); B, el estudio (entrada, cuenta sin acceso, overlays con piezas y escenas, rotar token, recursos, conexión sin conectar, conectada y revocada); C, las escenas de OBS; D, los paneles y el banner de Twitch; y E, el icono de app. Las notas del lienzo dicen qué componente de Regula va en cada sitio.
- El proyecto usa `@jotis-me/react` 0.2.0 y `@jotis-me/icons` 0.2.0. En 0.8.0:
  - Hay componentes nuevos que el diseño usa: `HeaderNav`, `Footer`, `LinkCard`, `Pager`, `ProgressSteps`, `ScaledPreview`, `TransparencyGrid`, `ButtonUtility` y `NumberInput`.
  - `@jotis-me/icons` desaparece y `Icon` ya no se exporta. Las props de icono reciben un componente de `@untitledui/icons` (`iconLeading={Plus}`) o un nodo (`<Plus size={16} />`), nunca un nombre. Un componente no cruza de un Server Component a uno de cliente: ahí hay que pasar el nodo.
  - `appIconSvg` pasa a `@jotis-me/react/app-icon` y `AppIcon` admite `app="scaena"`.
  - Los logos de terceros están en `@jotis-me/assets`.
- Hay unos 35 ficheros que importan de `@jotis-me/react`, y casi todos pasan iconos por nombre (`icon="play"`, `iconTrailing="link-external-01"`, `<Icon name="…">`, `IconName` en `StudioSidebar`, iconos de los paneles en `content/channel.yaml`).
- Los requisitos que cambian están en `openspec/changes/create-scaena/specs/` porque ese cambio no se ha archivado. Le quedan las comprobaciones de despliegue (11.x) y la 6.6.
- Las escenas de OBS (C), los paneles y el banner (D) y el icono (E) del lienzo coinciden con lo que ya hay. Lo único que cambia es `app="scaena"` en lugar de `letters="Sc" hue="lime"`.

## Goals / Non-Goals

**Goals:**
- Que la web y el estudio queden como en el lienzo, en claro y en oscuro, a 1440 px y a 390 px.
- Montar las pantallas con componentes de Regula 0.8.0 y quitar el marcado hecho a mano que el diseño sustituye (cabecera, pie, tarjeta de vídeo, paginación, barra superior del estudio).
- Que los overlays sigan dando lo mismo en OBS después de subir Regula.

**Non-Goals:**
- Cambiar rutas, la API, los parámetros de los overlays, la autenticación o lo que se guarda.
- Cambiar componentes de Regula. Si a alguno le falta algo para igualar el lienzo, se apunta para Regula y aquí se usa lo que hay.
- Los datos que el lienzo deja como hueco: la invitación de Discord y la fecha de conexión siguen saliendo de donde salen hoy (perfil y base de datos).
- Copiar las imágenes de muestra del lienzo (capturas de juego, cámara, miniaturas): la web usa las miniaturas reales de YouTube.

## Decisions

### 1. Subir Regula primero, en un paso aparte

Primero se sube `@jotis-me/react` a 0.8.0, se quita `@jotis-me/icons` y se migran los iconos de todo el código **sin cambiar ninguna pantalla**. La guía de Regula trae un script para esto (`scripts/migrate-icons.ts`, en el repositorio de Regula), que cambia `icon="search-lg"` por `icon={SearchLg}`. Después se revisa a mano lo que no puede resolver:
- Server Components que pasan iconos a componentes de cliente: se pasa el nodo (`<Play size={20} />`).
- `IconName` en tipos propios (`StudioSidebar`, `TEST_ALERTS`, iconos de paneles): pasa a `IconProp` o a un mapa de nombre a componente.
- `icon:` en `content/channel.yaml`: el YAML sigue guardando el nombre en kebab-case (es contenido, no código) y `lib/profile` lo traduce con un mapa cerrado de los iconos permitidos. Así la validación al construir puede rechazar un icono que no existe.
- `appIconSvg` del favicon: se importa de `@jotis-me/react/app-icon`.

Con esto en verde (`bun run ci`, e2e y comparación visual de los overlays), el resto del cambio solo toca pantallas. Si la subida rompe algo de los overlays, se ve aislado.

Alternativa descartada: migrar cada pantalla a la vez que se rediseña. Mezcla dos fuentes de fallo y deja el proyecto sin compilar hasta el final.

### 2. Logos de Twitch, YouTube y Discord

Se usan los de `@jotis-me/assets` si los trae los tres con licencia de la suite. Si no, se queda `components/brand/SocialLogo.tsx`, que ya los dibuja con `currentColor`. Es la misma marca que usa el lienzo y no cambia nada visible, así que se decide al implementar.

**Decidido al implementar:** se queda `SocialLogo`. `@jotis-me/assets` 0.8.0 trae los tres (`logos/social/twitch.svg`, `youtube.svg`, `discord-01.svg`, MIT), pero como SVG de color fijo (de marca o `-gray`). Dentro de un botón, del `Banner` de marca o de un `Badge`, el logo tiene que tomar el color del texto (`currentColor`), igual que en el lienzo, y esos ficheros no lo hacen.

### 3. Cabecera y pie de la web

- `SiteHeader` pasa a `HeaderNav type="simple"`. La marca es un enlace a `/` con `AppIcon app="scaena"` (variante `light` en claro, `default` en oscuro) y «Scaena». Los enlaces son «Inicio» (`/`) y «Vídeos» (`/videos`), con `current` según la ruta. En las acciones va el botón de tema. `HeaderNav` necesita saber la ruta, así que es un componente de cliente que usa `usePathname`.
- `ThemeToggle` pasa a `ButtonUtility` con luna o sol, y mantiene la lógica actual (`localStorage` y la clase `dark-mode` que pone `theme-init.js`).
- `SiteFooter` pasa a `Footer type="large-02"`: la marca, «Juegos en modo historia y ratos de charla, sin prisa.» (del perfil), las columnas «El canal» (redes con enlace, de `linkedSocials`) y «Esta web», y «Scaena es parte de jotis.me.».
- Se borra `SiteNav`.

### 4. Portada

Tres componentes nuevos en `components/web/home/`, que sustituyen a `WhoPlays`, `WhenAndWhere`, `GameDiary` y `LiveBadge`:

- **`Hero`**: componente de cliente porque depende del estado del directo (`useSiteStatus`). Lleva `StreamStatus` (con tiempo y categoría si hay directo), «Suele haber directo de 17:00 a 20:00.» sin directo (sale de `profile.schedule`), el lema como `h1`, la frase del perfil, el botón principal «Ver en Twitch» o «Entrar al directo» y «Ver los vídeos» como secundario. A la derecha, `BrowserFrame variant="minimal"` con la URL del canal y dentro: sin directo, `StreamScene variant="offline"` con los textos del perfil; con directo, la escena de juego (`GameLayout`, el mismo que ya usa el estudio, con `SAMPLE_CHAT` y `SAMPLE_EVENTS`) dentro de `ScaledPreview width={1920}`. El ancla `id="schedule"` pasa a esta sección, así `/live` sin directo no cambia de URL.
- **`StreamJourney`** («Cómo va un directo»): componente de cliente con el paso actual en estado. `ProgressSteps type="text-line"` con los cuatro pasos y `onChange`. Al lado, la escena del paso en una caja con borde, `shadow-lg` y `rounded-xl`: «Antes» `StreamScene starting` en pausa, «La partida» `GameLayout`, «La charla» `ChattingLayout`, «Después» `StreamScene ending`. Las escenas llevan `aria-hidden` e `inert`, porque son ilustración. Junto a la escena, el `Badge` de dónde pasa, el título, el texto y los botones del paso, en una región `aria-live="polite"`. Debajo, el botón `link-color` «Siguiente: …» o «Volver al principio». La escala de la escena sale del ancho de la caja, medido con un `ResizeObserver`, para que a 390 px quepa sin desplazamiento.
- **`LatestVideos`** («Lo último en YouTube»): Server Component. Los tres primeros de `videoPage(videos, "all", 1)` en `LinkCard as="li"` dentro de un `ul` en rejilla, con la miniatura como `preview` (`next/image`) y el enlace a `/videos?v=<id>`. Sin vídeos, el mismo `EmptyState` de la página de vídeos.

Los textos de los pasos y la frase de la web pasan al perfil (decisión 7).

### 5. Aviso de directo

`LiveBanner` sigue siendo `Banner layout="full" theme="brand"`, con el icono `Play`, «En directo: <título>», «<categoría>, <tiempo> en emisión» y `Button secondary sm` «Ver en Twitch» en `actions`. Se quitan los espectadores y el enlace `/live` del aviso, como en el lienzo. La lógica de cerrarlo por directo (`sessionStorage` con `startedAt`) no cambia.

### 6. Página de vídeos

- `PageHeader` con «Vídeos» y la descripción, y `VideoTabs` dentro (`Tabs type="button-gray" size="sm"`).
- El vídeo que suena: `ClickToPlay` se queda (el lienzo usa `VideoPlayer`, pero su nota dice que en código va el iframe de YouTube, y `ClickToPlay` ya cumple «no carga nada de YouTube hasta que se pulsa»). Al lado, el `Badge` del tipo, el título como `h2`, la línea de juego y duración, y «Abrir en YouTube».
- La rejilla: `LinkCard` en `ul`, sin el vídeo que suena. La descripción se arma en `lib/youtube/title.ts` (función nueva, con tests): «Directo resubido. Cyberpunk 2077 #1, 3:12:40» o «Editado, 10:04». Se borra `VideoCard`.
- `VideoPagination` pasa a `Pager` con `prev`, `next` y `labels` («Más recientes», «Anteriores»). Se borra el fichero si queda en una línea.
- `loading.tsx`: `Skeleton` del reproductor, del bloque de texto y de ocho tarjetas, con `aria-busy`.
- Vacío y error: `EmptyState` con el icono `Play` o `AlertTriangle`; en el error, «Abrir YouTube» como secundario y «Reintentar» como principal.

### 7. Perfil del canal

En `content/channel.yaml` y en `lib/profile/schema.ts`:
- Nuevo `site.intro`: «Scaena es la web del canal de Twitch de Jotis. Aquí ves si hay directo, cómo va uno y dónde queda cada partida cuando acaba.»
- Nuevo `site.footer`: «Juegos en modo historia y ratos de charla, sin prisa.»
- Nuevo `journey`: cuatro pasos (`before`, `game`, `chatting`, `after`), cada uno con `title`, `hint` (la línea bajo el título del paso), `heading`, `text` y `where` (`twitch` o `youtube`). Los textos son los del lienzo.
- Se quita `playSettings` y su validación de emojis. Se añaden `site.*` y `journey.*` a la validación.
- Se actualizan los textos que el lienzo ha reescrito: el panel «Vídeos» («Los directos, subidos enteros, y algún editado con lo mejor.») y la descripción que usa el panel «De qué va». La tercera norma del lienzo («Mi canal, mis normas. Si te parece injusto, hay más canales.») es más corta que la del perfil; se toma la del lienzo.
- El lienzo escribe el canal como `jotis1`. Manda el perfil (`jotis_1`), como se corrigió en `a09b982`.

### 8. Estudio

- **Armazón**: `StudioSidebar` sigue con `SidebarNav`, ahora con `AppIcon app="scaena"`, iconos como nodo y `responsive`. Se borra `StudioTopBar`: el botón de tema pasa a las acciones de `PageHeader` de cada página. `main` con `max-w-295`, `gap-8` y el padding del lienzo.
- **Entrada** (`/studio/login`): fondo `bg-secondary` con `BackgroundPattern grid-dot`, una cabecera mínima con la marca y el botón de tema, y una tarjeta centrada de 440 px con `AppIcon` de 48 px, «Entra en el Estudio», la descripción, el `Alert warning` de cuenta sin acceso (con la cuenta con la que se ha entrado, como ahora), el botón y el enlace a la web. El botón es principal («Entrar con Twitch») sin error y secundario («Probar con otra cuenta») con él.
- **Overlays**: `OverlaySources` se rehace (ya pasa de 800 líneas) y se parte en ficheros por tarjeta:
  - Arriba, en rejilla de dos columnas: «Token de los overlays» (`Input` de solo lectura con el token enmascarado y «Rotar token», que abre el `Modal` destructivo de siempre) y «Alertas de prueba» (los seis botones de `TEST_ALERTS`).
  - `Tabs type="underline"` con «Piezas» y «Escenas» y su número.
  - Cada fuente es un `article` con `CardHeader` (título, `badge` con el tamaño y descripción) y debajo la vista previa a 360 × 202 dentro de `TransparencyGrid` en oscuro, con `ScaledPreview`, y las opciones. Las opciones son las de ahora, con `Toggle`, `Select`, `Input` y `NumberInput` (cuenta atrás). Las frases de alerta pasan a la tarjeta «Alertas», con la nota de los huecos.
  - La URL va en un `Input` de solo lectura con `trailingButton` «Copiar», que pasa a «Copiada» al copiar.
  - La indicación de OBS («Actualizar al hacer visible la escena» y fondo transparente) va en la descripción de `PageHeader`.
  - `EventsNotice` se queda arriba (requisito de `twitch-events`, que el lienzo no dibuja).
  - La pestaña activa se guarda en la URL (`?tab=scenes`), para poder enlazarla y recargar sin perderla.
- **Recursos**: tarjeta del banner con `CardHeader` y «Exportar PNG» en sus acciones; `SectionHeader` «Paneles»; rejilla de 320 px con cada `ChannelPanel`, el enlace del panel en `Input` con «Copiar» cuando tiene acción, la nota del panel de redes y «Exportar PNG». «Exportar todo», principal, en `PageHeader`. La exportación no cambia.
- **Conexión**: sin conectar, tarjeta con `EmptyState` («Eventos sin conectar», «Conectar eventos» principal) y los permisos como `Badge`. Conectado, tarjeta con `AvatarLabel`, `Badge success` «Conectado» y «Desconectar», y la `Table` de suscripciones («7 de 8 activas»), con «Reactivar» en la fila revocada. Con una revocada, el `Alert warning` arriba. Ya está casi así; se ajusta a la estructura del lienzo.

### 9. Pruebas

- e2e que cambian: `site.spec.ts` (tres secciones, pasos, sin «Ajustes de partida»), `videos.spec.ts` (`Pager`, tarjeta sin el que suena, texto de la tarjeta), `studio.spec.ts` (pestañas, copiar dentro del `Input`, sin migas), `studio-login.spec.ts` y `theme.spec.ts` (el botón ahora es `ButtonUtility`).
- Accesibilidad: el `axe` de las e2e sigue en todas las páginas tocadas.
- Overlays: `overlay-layout.spec.ts`, `mounted-scenes.spec.ts` y `scenes.spec.ts` tienen que pasar sin tocar las referencias después del paso 1. Si cambian por Regula 0.8, se revisa la diferencia contra el lienzo (grupo C) antes de regenerar.
- Unitarias: la línea de la tarjeta de vídeo, el mapa de iconos del perfil y la validación de `journey` y `site`.

## Risks / Trade-offs

- [Regula 0.8 cambia componentes que ya se usan (`StreamScene`, `ChatBox`, `Banner`, `SidebarNav`…)] → el paso 1 va solo y con la comparación visual de los overlays. Lo que cambie se compara con el lienzo, que ya está hecho sobre 0.8.
- [El script de migración de iconos está en el repositorio de Regula, no en el paquete] → si no está a mano, la migración se hace con búsqueda y reemplazo; el compilador marca cada `icon="…"` que quede, porque el tipo ya no admite cadenas.
- [La escena de juego de muestra en la portada en directo puede leerse como el directo de verdad] → va dentro del marco con la URL del canal, y el botón principal dice «Entrar al directo». Sigue la nota del lienzo («el marco enseña lo que verías en Twitch»). Sin directo, la escena offline es la real.
- [Quitar los espectadores y `/live` del aviso] → `/live` sigue existiendo y es lo que se comparte; el número de espectadores no estaba en el diseño nuevo.
- [Los deltas modifican requisitos que todavía están en `create-scaena`] → hay que archivar `create-scaena` antes que este cambio. Si se archiva este primero, `openspec archive` no encuentra los requisitos.
- [Más JavaScript en la portada: `Hero` y `StreamJourney` son de cliente y la escena de juego monta `ChatBox` y `StreamEvents`] → las escenas de los pasos solo se montan al elegir su paso, y la de juego del marco solo con directo.

## Migration Plan

1. Subir Regula y migrar iconos sin cambios visibles (decisión 1). Comprobar `bun run ci` y todas las e2e.
2. Perfil: esquema, YAML y validación (decisión 7).
3. Web: cabecera y pie, portada, aviso, vídeos.
4. Estudio: armazón, entrada, overlays, recursos, conexión.
5. Comparar cada pantalla con su tablero del lienzo en claro, oscuro y móvil.

Vuelta atrás: cada paso es un commit; el 1 se puede revertir solo, porque no toca pantallas.
