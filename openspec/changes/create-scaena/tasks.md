# Tasks

Las reglas de regula.jotis.me se aplican a todas las tareas (design.md, decisión 12). Ninguna tarea de interfaz empieza antes de cerrar el grupo 1.

## 1. Diseño (antes de cualquier interfaz)

- [x] 1.1 Escribir y entregar al usuario el prompt para Claude Design con el sistema de diseño Jotis.me. Debe cubrir todo lo de design.md, decisión 0, con el contenido real del perfil del canal y el icono "Sc" en `lime`. No repite la guía de Regula, porque Claude Design ya tiene acceso al sistema Jotis.me. Verificar que el usuario tiene el prompt y lo da por bueno
- [x] 1.2 Revisar el diseño que salga contra la guía de Regula: tokens, un `primary` por vista, "En directo" sin rojo, voz y formatos, claro y oscuro, tamaños de Twitch, estados vacío, error y carga. Pasar los fallos al usuario para iterar. Verificar que la lista de comprobación queda sin fallos y que el usuario aprueba el diseño
- [x] 1.3 Apuntar en design.md ("Diseño aprobado") el enlace del artefacto. Si el diseño cambia algo de las specs, revisar el cambio con `/opsx:update` antes de seguir. Verificar que `openspec validate create-scaena --strict` pasa

## 2. Base del proyecto

- [x] 2.1 Comprobar que `@jotis-me/tokens`, `@jotis-me/icons` y `@jotis-me/react` 0.2.0 están en npm (`bun info @jotis-me/react`); si no, apuntar a los `.tgz` de `regula/.pack` y anotarlo en el README. Verificar que `bun install` los resuelve
- [x] 2.2 Crear el proyecto Next.js 16 (App Router, TypeScript) con Bun, React 19 y Tailwind v4 (`@tailwindcss/postcss`), como `regula/examples/next`. Añadir Biome como único linter y formateador (sin ESLint ni Prettier), Vitest y Playwright. Scripts con Bun: `dev`, `build`, `start`, `lint`, `test` y `test:e2e`. Verificar que `bun run build`, `bunx biome check .` y `bun run test` pasan
- [x] 2.3 Crear `app/globals.css` (`@import "tailwindcss"; @import "@jotis-me/react/styles.css";`) y el layout de la web con el script en línea que pone `dark-mode` antes de pintar (elección guardada o, si no hay, `prefers-color-scheme`). Verificar con Playwright que en modo oscuro emulado y sin elección el primer fotograma ya es oscuro, y que con una elección guardada manda la elección
- [x] 2.4 Crear el layout de overlay (fondo transparente, `dark-mode` en `<html>`, sin márgenes ni desplazamiento, sin cabecera) y la cabecera `Cache-Control: no-store` para `/overlay/**`. Verificar con Playwright que el fondo de `body` es `rgba(0, 0, 0, 0)`
- [x] 2.5 Añadir la comprobación de colores (nada de hex ni paleta cruda en `app/`, `components/` y `lib/`, como el `check:colors` de Regula) al CI. Verificar que falla con un `bg-indigo-600` de prueba y pasa sin él
- [x] 2.6 Crear `lib/format` con `Intl` `es-ES` (cifras, importes, fechas `29 oct 2026`, duraciones `1:02:05`). Verificar con tests de Vitest de cada formato
- [x] 2.7 Crear el cliente de Redis (Upstash REST), con un único sitio que construye las claves por canal (`channel:<id>:…`, design.md, decisión 14), y el módulo de variables de entorno validadas con Zod, que falla al arrancar si falta alguna. Verificar con tests unitarios de la validación y de que las claves de dos canales nunca coinciden
- [x] 2.8 Configurar Prisma 7 con Neon (`@prisma/adapter-neon`) y better-auth (`prismaAdapter`). Generar los modelos de better-auth con su CLI en `prisma/schema.prisma`, crear la primera migración y montar `app/api/auth/[...all]/route.ts` con el proveedor `twitch` y los tres permisos de eventos. Verificar que `bunx prisma migrate dev` aplica la migración contra una base local o de rama de Neon y que `GET /api/auth/ok` responde 200
- [x] 2.9 Añadir `.env.example` con todas las variables del design y un README con desarrollo y despliegue. Verificar que los comandos del README funcionan tal cual

## 3. Perfil del canal (channel-profile)

- [x] 3.1 Definir el esquema Zod del perfil en `lib/profile` y el script `validate-profile`, que se ejecuta como `prebuild`. Los campos son los de design.md, decisión 8: identidad, Twitch, YouTube, lema, descripción, ajustes de partida, horario habitual, qué se emite, redes con enlace opcional, normas, paneles, textos de escenas, frases de alerta, nombre de cámara y `chat.ocultos`. Incluir el límite de Regula de 24 caracteres por titular y el rechazo de emojis en los textos visibles. Exponerlo solo con `getProfile(channel)`, que hoy lee el YAML y da error claro si el canal no es el configurado. Verificar con tests de Vitest que un perfil válido pasa, que cada error nombra su campo y que pedir otro canal falla
- [x] 3.2 Escribir `content/channel.yaml` con los textos del diseño aprobado, sacados del artefacto, no reescritos. Discord queda sin enlace hasta tener la invitación. Verificar que `bun run build` pasa, y que falla con mensaje claro al poner una hora `25:00`, un titular de 30 caracteres o un emoji
- [x] 3.3 Crear el ayudante de horario: "Normalmente 17:00 – 20:00", la forma corta del banner ("Suele ser 17-20 h") y "Sin fijar" cuando no hay días. Verificar con tests de los tres textos y de una franja con días

## 4. Overlays sin datos en vivo (obs-overlays), según el diseño aprobado

- [x] 4.1 Crear el lector de parámetros de overlay (números, booleanos, fechas, listas cerradas), que cae al valor por defecto si el valor no vale. Verificar con tests de Vitest (por ejemplo, `rows=abc` → 5)
- [x] 4.2 Crear `/overlay/[channel]/scene/{starting,brb,ending,offline}` con `StreamScene` a `scale={1}`. Usar la insignia, el titular y el subtítulo del perfil, la cuenta atrás por `minutes` o `target`, y el pie por `next` en "final" y "offline". Verificar con Playwright:
  - a 1920×1080, la escena llena la ventana sin desplazamiento y coincide con el diseño;
  - con `minutes=8`, la cuenta atrás empieza en 08:00;
  - con un `target` a diez minutos, muestra 10:00.
- [x] 4.3 Crear `/overlay/[channel]/camera` con `CamFrame` (proporción, nombre por defecto "Jotis" del perfil, rol, en directo) por parámetros. Verificar con Playwright que el interior del marco es transparente
- [x] 4.4 Añadir tests de Playwright para estos dos casos: con `prefers-reduced-motion`, las piezas con entrada solo cambian la opacidad; con la página emulada en claro, los overlays siguen en oscuro

## 5. Chat (twitch-chat)

- [x] 5.1 Escribir el analizador de mensajes IRC de Twitch (etiquetas, `PRIVMSG`, `CLEARMSG`, `CLEARCHAT`, `PING`, `RECONNECT`). Verificar con tests sobre líneas reales capturadas, incluidos caracteres escapados en las etiquetas
- [x] 5.2 Escribir la conversión a `ChatMessage` de Regula: insignias por prioridad (emisor, mod, VIP, sub, bits; máximo tres), tono estable por `user-id` y texto plano. Verificar con tests (moderador suscrito → mod y sub; mismo usuario → mismo tono)
- [x] 5.3 Escribir el estado del chat: máximo doce mensajes, borrado por id y por usuario, limpieza total, y ocultar a los usuarios del perfil y los mensajes que empiezan por `!`. Verificar con tests de cada caso
- [x] 5.4 Escribir el cliente WebSocket anónimo: capacidades, unión al canal, respuesta a `PING` y reconexión con espera creciente hasta 15 s. Verificar con un test contra un servidor WebSocket falso que corta la conexión y comprueba que se reconecta y conserva los mensajes
- [x] 5.5 Crear `/overlay/[channel]/chat` con `ChatBox` según el diseño (`translucent`, `fade`, `animate`, ancho y alto por parámetro). Verificar con Playwright y el servidor falso que un mensaje con `<img onerror>` se pinta como texto y no ejecuta nada

## 6. Eventos de Twitch (twitch-events)

- [x] 6.1 Escribir la verificación de la firma de EventSub (HMAC-SHA256 sobre id + marca de tiempo + cuerpo crudo, comparación en tiempo constante, máximo 10 min). Verificar con tests: firma buena, firma falsa, cuerpo alterado y marca de tiempo antigua
- [x] 6.2 Escribir la normalización de notificaciones a eventos de Regula (follow, sub, resub, gift, raid, bits), ignorando `channel.subscribe` con `is_gift`. Verificar con tests sobre las cargas de ejemplo de la documentación de Twitch
- [x] 6.3 Crear `POST /api/twitch/eventsub` con:
  - respuesta al reto y registro de revocaciones;
  - duplicados descartados con `SET NX EX 600`;
  - `XADD channel:<id>:events` con retención de 24 h;
  - aviso a la caché de estado en `stream.online` y `stream.offline`.
  
  Verificar con tests de integración contra un Redis falso: 403 con firma falsa y una sola entrada si llega dos veces el mismo id
- [x] 6.4 Escribir el token de app de Twitch (client credentials, en Redis hasta que caduca) y el cliente mínimo de Helix. Verificar con un test que reutiliza el token y lo renueva tras un 401
- [x] 6.5 Crear la entrada al estudio con better-auth, según el diseño (design.md, decisiones 1b y 9):
  - `/studio/login` con "Entrar con Twitch" (`signIn.social`);
  - hook que rechaza los ids que no están en `STUDIO_ALLOWED_TWITCH_IDS` sin crear usuario ni sesión;
  - sesión de 30 días;
  - `proxy.ts` que redirige `/studio/**` a la entrada, y `auth.api.getSession` en cada página y en `/api/studio/**` (401);
  - "Salir" con `signOut`;
  - aviso de estudio privado para cuentas no permitidas.
  
  Verificar con tests de integración contra un Twitch simulado: jotis_1 entra; otra cuenta no obtiene sesión ni se crea en la base; sin sesión se redirige a la entrada; una cookie manipulada se rechaza; "Salir" invalida la sesión
- [ ] 6.6 Crear `/studio/connection` según el diseño, con:
  - alta de las ocho suscripciones sin duplicar;
  - lista de su estado y botón para borrarlas;
  - textos de error serios y que digan cómo arreglarlo.
  
  Verificar con tests del alta (no duplica) y probando el flujo completo con la CLI de Twitch (`twitch event trigger`) contra el despliegue de prueba
- [x] 6.7 Crear `GET /api/events` (SSE) con:
  - comprobación del token en tiempo constante (401 sin abrir el flujo);
  - reanudación por `Last-Event-ID` y, sin él, los últimos 10 min;
  - latido cada 15 s y cierre antes del límite de la función.
  
  Verificar con un test que desconecta, añade un evento y comprueba que llega una sola vez al reconectar
- [x] 6.8 Escribir el cliente de eventos del navegador (EventSource, sin reintento ante 401) y la cola de alertas (una a una, `enter` → duración → `exit`). Verificar con tests de la cola con temporizadores falsos (follow y sub seguidos salen en orden)
- [x] 6.9 Escribir las frases de alerta (design.md, decisión 9):
  - ajustes por canal en `channel:<id>:settings`, validados con Zod;
  - huecos `{meses}`, `{cantidad}`, `{espectadores}` y `{bits}`, con un máximo de 120 caracteres;
  - relleno en texto plano y frase del perfil cuando no hay ninguna guardada;
  - `GET/PUT /api/studio/settings`;
  - aviso `settings` por el flujo SSE.
  
  Verificar con tests: renovación de 14 meses → "14 meses ya. Gracias por seguir aquí."; `{nombre}` se rechaza con mensaje que lista los huecos; `<b>` queda literal; sin ajustes se usa la frase del perfil
- [x] 6.10 Crear según el diseño:
  - `/overlay/[channel]/alerts`, con la frase de cada tipo y `message` para enseñar o no el mensaje del espectador;
  - `/overlay/[channel]/events`, con `StreamEvents`, `rows` y `animate`;
  - `/overlay/[channel]/goal`, con `StreamGoal`, `type` (`subs`, `follows`, `bits`), `label`, `start`, `goal`, `unit` y `since`; los regalos suman su cantidad.
  
  Verificar con Playwright contra un flujo SSE falso:
  - en la meta, 284 + un regalo de 5 muestra 289, y al recargar se mantiene la cuenta;
  - al cambiar una frase en el estudio, la siguiente alerta ya la usa sin recargar la fuente;
  - con `prefers-reduced-motion`, la alerta real entra y sale solo con fundido (como `e2e/overlay-motion.spec.ts`, ya sobre la pieza)

## 7. Estado del directo (live-status)

- [x] 7.1 Escribir el servicio de estado (Helix `/streams`, caché de 60 s, último estado bueno, borrado de caché desde EventSub, "offline" si no hay nada). Verificar con tests de los casos en directo, offline, Twitch caído y caché borrada por `stream.online`
- [x] 7.2 Crear `GET /api/status` con `s-maxage=30`. Verificar con un test de la respuesta y sus cabeceras
- [x] 7.3 Crear `/overlay/[channel]/status` con `StreamStatus`: sondeo cada 30 s, tiempo en emisión calculado en el cliente y espectadores solo con `viewers=1`. Verificar con Playwright que por defecto no aparece la cifra
- [x] 7.4 Crear las escenas montadas `/overlay/[channel]/scene/game` y `/scene/chatting` (design.md, decisión 15). Van con las piezas en las posiciones del diseño, reutilizando los componentes de cliente de los overlays sueltos, con `token` y con `chat`, `camera`, `events` y `goal` para quitar piezas. Verificar con Playwright:
  - a 1920×1080, coinciden con el diseño;
  - en la de juego, ninguna pieza fija ocupa la franja de 480 a 1440 px;
  - en Just Chatting, la meta y los eventos van a plena opacidad;
  - sin token, se ven el chat, el estado y el marco, pero no las alertas, los eventos ni la meta;
  - con `goal=0`, no queda hueco donde iba la meta

## 8. Vídeos de YouTube (youtube-vods)

- [x] 8.1 Escribir el cliente de YouTube (`channels.list?forHandle` para la lista de subidas, `playlistItems.list` + `videos.list`) y el filtro de privados, ocultos, eliminados y estrenos pendientes, con duración. Verificar con tests sobre respuestas reales guardadas
- [x] 8.2 Escribir la caché (frescura de 1 h, copia de respaldo, vacío si no hay nada) y la paginación de doce. Verificar con tests: una sola consulta en muchas lecturas dentro de la hora, respaldo ante cuota agotada y página 2 de 30 → vídeos 13 a 24
- [x] 8.3 Escribir `lib/youtube/title` (`^(.+) - (.+) #(\d+)$`: directo resubido con juego y número; si no, editado) y el filtro por tipo antes de paginar. Verificar con tests de todos los escenarios de la spec:
  - "La ciudad que nunca duerme - Cyberpunk 2077 #1";
  - "Antes - después - Elden Ring #12";
  - un editado cualquiera;
  - "Cyberpunk 2077 #1" y "Algo - Cyberpunk 2077 #uno", que salen como editados;
  - el filtro `live` aplicado antes de paginar

## 9. Web pública (channel-site), según el diseño aprobado

- [x] 9.1 Crear la cabecera (`AppIcon` "Sc" y "Scaena" en Bricolage bold, sin "jotis.me"), el botón único de tema (luna en claro, sol en oscuro, con nombre accesible, elección guardada), el pie y el favicon con la variante sólida. Verificar con Playwright que coinciden con el diseño en claro y oscuro, que el botón cambia el tema sin recargar y que la elección se mantiene al volver
- [x] 9.2 Crear la portada según el diseño, en cuatro secciones:
  - quién juega y cómo, con lema, enlace a Twitch, descripción y "Ajustes de partida" como lista fija sin controles;
  - "Cuándo suelo estar" (ancla `#schedule`);
  - "Dónde verlo", con el estado actual y Discord oculto mientras no tenga enlace;
  - "Diario de partidas", con seis vídeos.
  
  Verificar con Playwright en claro y oscuro: axe sin errores, como mucho un botón `primary` por vista y el foco sin pararse en "Ajustes de partida"
- [x] 9.3 Crear el componente de cliente del aviso de directo según el diseño:
  - `Banner` de marca a todo el ancho, con título, categoría, tiempo en emisión y espectadores;
  - "Ver en Twitch" y el enlace `/live`;
  - se puede cerrar para esa visita;
  - sondeo de `/api/status` cada 30 s;
  - "En directo" en índigo, sin rojo.
  
  Verificar con Playwright: aparece y se va sin recargar al cambiar el estado simulado; cerrado no vuelve en la visita; no usa tokens de error
- [x] 9.4 Crear `/live` (302 a Twitch en directo, a `/#schedule` si no, sin caché). Verificar con tests de los dos casos
- [x] 9.5 Crear `/videos` según el diseño:
  - pestañas "Todos", "Directos" y "Editados" (`type`), y paginación "Más recientes" y "Anteriores" (`page`);
  - tarjetas con tipo en gris y, en los directos, "juego - #n";
  - vídeo en reproducción arriba (`v`), con reproductor de clic para cargar (`youtube-nocookie.com`);
  - fechas `29 oct 2026` y duraciones del módulo de formato;
  - estados vacío, carga y error, con "Reintentar" como único `primary`.
  
  Verificar con Playwright: no hay peticiones a YouTube antes del clic; el filtro y la paginación cambian la URL; el foco recorre la página en orden
- [x] 9.6 Añadir título, descripción e imagen para redes (el banner exportado) en cada página. Verificar con un test que lee las etiquetas `og:` de la portada

## 10. Estudio y recursos del perfil (obs-overlays, twitch-profile-assets), según el diseño aprobado

- [x] 10.1 Crear el armazón del estudio según el diseño: barra lateral (Overlays, Recursos, Conexión; cuenta de Twitch de la sesión y "Salir"), sin selector de canal, y `/studio` redirige a `/studio/overlays`. Verificar con Playwright que la página actual se marca en la barra y que "Salir" cierra la sesión
- [x] 10.2 Crear `/studio/overlays` según el diseño. Lleva:
  - el token de overlay, generado la primera vez, con "Rotar token" detrás de un `Modal` de confirmación (`POST /api/studio/token`);
  - las seis piezas y las seis escenas, cada una con vista previa con datos de ejemplo, opciones con etiqueta visible, URL lista para copiar (con `token` donde haga falta y, en la meta, `since`) y el recordatorio de OBS;
  - "Enseñar espectadores" desactivado por defecto;
  - el editor de frases de alerta.
  
  Verificar con Playwright:
  - al marcar "translúcido" cambian la URL y la vista previa;
  - cancelar la confirmación no rota el token;
  - tras rotarlo, la URL vieja deja de recibir eventos;
  - una frase guardada se mantiene al recargar;
  - con una cookie de sesión inventada no se ve nada del estudio: la página comprueba la sesión de verdad, no solo `proxy.ts`
- [x] 10.3 Crear `POST /api/studio/test` y los seis botones de "Alertas de prueba". Verificar con Playwright que "Raid - 1.284" hace entrar una alerta de raid con su frase en `/overlay/[channel]/alerts`, abierto en otra pestaña
- [x] 10.4 Crear `/studio/assets` según el diseño: el banner a media escala y cada `ChannelPanel` del perfil con su ficha y, si tiene acción, su enlace para copiar. Verificar con Playwright que hay un panel por entrada del perfil
- [x] 10.5 Escribir la exportación en el navegador (design.md, decisión 11): `modern-screenshot`, `scale` 2 para paneles y 1 para el banner, espera a `document.fonts.ready`, "Exportar PNG" por pieza y "Exportar todo" en `.zip`. Verificar con Playwright:
  - `panel-normas.png` mide 640px de ancho y `banner.png` 1200×480;
  - el `.zip` trae todos los PNG;
  - cada PNG difiere de una captura de Chromium del mismo nodo por debajo del umbral

## 11. Integración y puesta en marcha

- [ ] 11.1 Desplegar en una URL de prueba de Vercel con las variables reales y comprobar de punta a punta con `twitch event trigger` que follow, sub, resub, gift, raid y bits llegan a alertas, eventos y meta
- [ ] 11.2 Cargar todos los overlays en OBS a 1920×1080 durante un directo de prueba de al menos 30 minutos. Comprobar la transparencia, la reconexión tras cortar la red, que no salen mensajes de los usuarios ocultos y que la escena de juego coincide con el diseño aprobado
- [ ] 11.3 Apuntar `scaena.jotis.me`, entrar con Twitch, conectar los eventos en `/studio/connection` y comprobar que la portada y `/live` cambian al empezar y terminar un directo

## Workflow follow-up

- Archivar el cambio cuando el directo de prueba confirme el comportamiento.
- Proponer en Regula, en un cambio aparte, emotes como imagen en `ChatBox` si se quieren más adelante.
- Segunda versión: sección "En la estantería" en la portada (cada juego con horas jugadas y estado), propuesta en el diseño y aplazada.
- Añadir Scaena ("Sc", `lime`) al registro de apps de Regula.
