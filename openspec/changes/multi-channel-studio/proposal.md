# Proposal

## Why

Queremos que sunara__ use Scaena con su canal. Hoy el estudio está hecho para uno solo, jotis_1:

- El perfil sale de `content/channel.yaml`, y `repoProfileOf` rechaza cualquier otro login.
- Overlays construye las URLs con el login del canal principal.
- Recursos solo deja guardar al dueño de ese perfil.
- La lista de cuentas permitidas está en una variable de Vercel.

Si sunara__ entrara hoy, vería tus textos y tendría URLs de `jotis_1` con su token, que no funcionan. Lo que sí va ya por canal son los datos de Redis (token, metas, frases y eventos) y la tabla `channel_profile`.

## What Changes

- **Cada canal con lo suyo en el estudio.** El estudio trabaja siempre con el canal de la sesión: su perfil, sus URLs en `/overlay/<su login>/…`, su token, sus metas, sus frases, su conexión de eventos y su guía. Nada de un canal se ve ni se cambia desde otro.
- **Perfil de un canal añadido.**
  - El canal principal sigue saliendo de `content/channel.yaml`.
  - Uno añadido empieza desde su Twitch: nombre, foto y descripción del canal. Las redes llevan solo Twitch, y las normas y el horario quedan vacíos para rellenarlos en Recursos. Los paneles son los que salen de sus datos («De qué va», «Horario», «Normas» y «Redes»), y los de «Normas» y «Redes» aparecen cuando tenga qué poner. Los textos de escenas, alertas y cámara llevan unos genéricos neutros, con su nombre donde toca.
  - Lo que cambia en Recursos se guarda en `channel_profile` con su login, como ya pasa con el principal.
- **Esquema del perfil más flexible para los añadidos.** YouTube pasa a ser opcional, y normas, paneles y qué se emite pueden ir vacíos. El perfil del repositorio sigue validándose como ahora: el canal principal tiene que tenerlo todo, porque alimenta la web.
- **Sección «Cuentas» en el estudio**, solo para los administradores (los ids de `STUDIO_ALLOWED_TWITCH_IDS`):
  - **Añadir:** se escribe el usuario de Twitch y Scaena lo busca en Twitch para enseñar su nombre y su foto antes de confirmar.
  - **Lista:** las cuentas con acceso, con quién las añadió y cuándo.
  - **Quitar:** deja a la cuenta sin acceso al momento, porque se cierran sus sesiones, y da de baja sus suscripciones de eventos. Sus datos se conservan, así que volver a añadirla lo recupera todo.
  - El canal principal y los administradores no se pueden quitar desde aquí.
- **Entrada al estudio**: puede entrar quien esté en `STUDIO_ALLOWED_TWITCH_IDS` o en la lista de «Cuentas».
- **Sin cambios en la web pública** (portada, vídeos, horario de la web): sigue siendo solo la del canal principal.
- Versión 0.5.0.

## Capabilities

### New Capabilities

- `studio-accounts`: quién puede entrar al estudio y cómo se da y se quita el acceso desde la sección «Cuentas».

### Modified Capabilities

- `obs-overlays`: «Acceso al estudio con Twitch» admite las cuentas añadidas. Se añade «Cada canal con lo suyo».
- `channel-profile`: «Contenido del canal en un solo sitio» distingue el canal principal, del repositorio, de los añadidos, que empiezan desde Twitch. Se añade «Perfil de un canal añadido».
- `twitch-profile-assets`: se añade «Recursos del canal de la sesión».
- `channel-site`: «Navegación del estudio» enseña «Cuentas» solo a los administradores.

## Impact

- **Base de datos**: tabla nueva `studio_channel`, con id de Twitch, login, nombre, foto, descripción, quién la añadió y cuándo. Lleva su migración de Prisma.
- **Perfil**: `lib/profile` pasa a resolver el perfil base por canal: el YAML para el principal y uno generado desde `studio_channel` para los demás. `repoProfileOf` pasa a ser asíncrona y cambian sus llamadas (`lib/channel.ts`, `lib/overlay/channel.ts`, la API de eventos y estado, y la de perfil). El esquema relaja YouTube y las listas solo para los perfiles generados.
- **Sesión y estudio**: `StudioSession` gana `login` y `admin`. Overlays, Guía, Recursos y Conexión usan el perfil de la sesión en lugar de `loadMainProfile`.
- **Auth**: `mapProfileToUser` consulta también `studio_channel`. Al entrar se guarda o actualiza la fila de la cuenta, con su login, nombre y foto al día.
- **Twitch**: `GET /helix/users?login=` para buscar al añadir, con el token de app que ya existe.
- **Rutas nuevas**: `/studio/accounts` y `/api/studio/accounts` (GET, POST y DELETE).
- **Sin cambios** en la web pública ni en los datos de Redis.
