# Proposal

## Why

El canal de Twitch de jotis.me no tiene herramientas propias: los overlays de OBS, los paneles del perfil y la web del canal dependen de servicios de terceros con otra estética. Regula ya trae la familia Stream (alertas, chat, metas, escenas, paneles y banner), así que falta la app que la conecte a los datos reales de Twitch y YouTube y la sirva como fuentes de navegador y como web pública.

## What Changes

- Nueva app **Scaena** (`scaena.jotis.me`), de la suite jotis.me, construida con los paquetes de Regula (`@jotis-me/tokens`, `@jotis-me/icons`, `@jotis-me/react`) y desplegada en Vercel. Sigue las reglas de regula.jotis.me en todo: tokens, voz y formatos, una acción principal por vista, cabecera con "Scaena" en el estilo que la guía da a "jotis.me", icono de app "Sc" en tono `lime`, un único botón de luna o sol para el tema y URLs siempre en inglés.
- **Diseño antes que interfaz**: todas las pantallas (web, estudio, overlays montados, paneles y banner) se diseñan primero en Claude Design con el sistema de diseño Jotis.me. Ninguna interfaz se programa hasta que el diseño está aprobado.
- **Overlays para OBS**: una URL por pieza (chat, alertas, eventos recientes, meta, estado del directo y marco de cámara), las escenas de empezando, vuelvo enseguida, final y offline, y dos escenas montadas listas para usar (juego y Just Chatting). Todas con fondo transparente, a 1920×1080 y configurables por parámetros de la URL. Las frases de las alertas se editan desde el estudio.
- **Chat en directo** leído de Twitch, con insignias y tono por rol, que respeta los mensajes borrados y los baneos.
- **Eventos de Twitch en tiempo real** (follows, subs, renovaciones, subs regaladas, raids y bits) recibidos por EventSub, verificados y entregados a los overlays sin duplicados.
- **Estado del directo** (en directo, offline, categoría, título, espectadores) compartido por la web y los overlays.
- **Web pública del canal**: una portada que cuenta el canal de arriba abajo (quién juega y cómo, cuándo suele estar, dónde verlo y el diario de partidas), un aviso de directo con enlace a Twitch, y los vídeos de YouTube filtrables por directos y editados, con el tipo y el juego sacados del título.
- **Recursos del perfil de Twitch**: paneles de 320px (exportados a 640px) y banner de 1200×480, exportables como PNG desde el propio estudio.
- **Perfil del canal** como única fuente de contenido (descripción, horario, redes, normas, paneles), versionado en el repositorio.

## Capabilities

### New Capabilities

- `channel-profile`: contenido editable del canal (nombre, descripción, horario, redes, normas y paneles) del que beben la web, las escenas, los paneles y el banner.
- `obs-overlays`: páginas pensadas para usarse como fuente de navegador en OBS: transparencia, tamaños, parámetros de URL, movimiento y comportamiento al perder la conexión.
- `twitch-chat`: lectura del chat del canal y su presentación en el overlay, incluida la moderación (mensajes borrados, baneos, limpieza del chat).
- `twitch-events`: alta del canal en EventSub, recepción verificada de eventos, eliminación de duplicados y entrega en tiempo real a los overlays de alertas, eventos y metas.
- `live-status`: saber si el canal está en directo y con qué datos, con caché, para la web y el overlay de estado.
- `youtube-vods`: listado de directos resubidos a YouTube, con caché y degradación si la API falla.
- `channel-site`: web pública del canal (portada, aviso y redirección al directo, horario, VODs).
- `twitch-profile-assets`: paneles y banner del perfil de Twitch con vista previa y exportación a PNG en los tamaños de Twitch.

### Modified Capabilities

Ninguna: el proyecto no tiene specs todavía.

## Impact

- **Proyecto nuevo** en `scaena/` (Next.js 16 + React 19 + Tailwind v4, con Bun y Biome, como `regula/examples/next`; better-auth con Prisma sobre Neon Postgres para el estudio). Consume `@jotis-me/*` desde npm; no modifica Regula.
- **Diseño**: un artefacto de Claude Design con el sistema Jotis.me, aprobado antes de implementar la interfaz; su enlace queda en `design.md`.
- **Servicios externos**: Twitch Helix, EventSub (webhooks) y el chat de Twitch; YouTube Data API v3; un Redis gestionado (Upstash) para la cola de eventos y las cachés, y Neon Postgres para la autenticación, los dos desde el Marketplace de Vercel.
- **Secretos** en Vercel: credenciales de la app de Twitch, secreto de EventSub, clave de YouTube, credenciales de Redis y un token para las URLs de overlay.
- **Fuera de alcance**: donaciones (Twitch no las tiene de forma nativa), emotes como imagen en el chat, canje de puntos del canal, "suena ahora", multicanal panel de administración web (el contenido se edita en el repositorio) y la sección "En la estantería" (juegos con horas y estado), que queda para una versión posterior.
