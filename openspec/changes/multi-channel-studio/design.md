# Design

## Context

- **Perfil** (`lib/profile/index.ts`):
  - `repoProfile()` lee y valida `content/channel.yaml`.
  - `repoProfileOf(login)` lanza un error con cualquier login que no sea el del YAML.
  - `load(login)` mezcla el perfil base con lo guardado en `channel_profile`, que ya va por login.
  - `loadMainProfile()` es el perfil del principal.
- **Overlays por canal**: `/overlay/[channel]/…` usa `profileForOverlay(channel)`, que da 404 si `repoProfileOf` falla. `/api/events?channel=<login>` saca el id con `channelIdOf(login)`, que pasa por `repoProfileOf` y luego por Helix con caché. El token se comprueba contra el id.
- **Estudio** (usan el canal principal, no el de la sesión):
  - `overlays/page.tsx` y `api/studio/settings` (frases por defecto) usan `loadMainProfile()`.
  - `assets/page.tsx` y `api/studio/profile` usan `repoProfile()` como base.
  - Recursos solo deja guardar si `channelIdOf(base.twitch.login) === session.channelId`.
- **Datos que ya van por el canal de la sesión**: token, metas, frases, `goal-done`, metas de Twitch, EventSub y la conexión, todo por `session.channelId`.
- **Acceso** (`lib/auth.ts`): `mapProfileToUser` rechaza los ids que no están en `STUDIO_ALLOWED_TWITCH_IDS`. Se ejecuta en cada entrada.
- **Web pública**: layout, portada, vídeos, pie, metadatos, `/live`, `/api/status` y `lib/site.ts` usan el principal, y así se quedan.
- **Esquema** (`lib/profile/schema.ts`): `youtube` es obligatorio; `description`, `streams`, `socials`, `rules` y `panels` piden al menos uno.

## Goals / Non-Goals

**Goals:**
- Que cada cuenta del estudio trabaje con su canal sin ver ni tocar los datos de otro.
- Que un canal añadido empiece con lo de su Twitch y lo demás vacío.
- Que los administradores den y quiten acceso desde el estudio.

**Non-Goals:**
- Web pública para los canales añadidos.
- Varios administradores gestionados desde el estudio: los administradores siguen siendo los de la configuración.
- Borrar los datos de una cuenta al quitarla: se conservan.
- Que un canal añadido tenga el texto del perfil del repositorio: empieza desde Twitch.

## Decisions

### 1. Tabla `studio_channel`

```prisma
model StudioChannel {
  twitchId    String   @id
  login       String   @unique
  name        String
  image       String?
  description String   @default("")
  addedBy     String?  // id de Twitch de quien la añadió; null si es un administrador
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("studio_channel")
}
```

Es la lista de cuentas con acceso y, a la vez, la foto de su Twitch con la que se genera su perfil. Los administradores también tienen su fila: se crea o se actualiza al entrar, porque así el estudio saca de ella el login de cualquier sesión.

### 2. Quién entra

`mapProfileToUser` pasa a ser asíncrono:

1. Si el id está en `STUDIO_ALLOWED_TWITCH_IDS`, entra.
2. Si no, entra solo si hay una fila en `studio_channel` con ese id.
3. Si entra, se hace un `upsert` de su fila con `preferred_username`, el nombre y `picture` del perfil de Twitch, para que un cambio de login o de foto quede al día.

**Comprobar al aplicar:** que better-auth admite un `mapProfileToUser` que devuelve una promesa. Si no, la comprobación va en `databaseHooks.session.create.before`, que sí lo admite.

### 3. Perfil base por canal

`repoProfileOf(login)` pasa a ser `baseProfileOf(login): Promise<Profile | null>`:

- **Login del YAML:** `repoProfile()`, como hoy.
- **Login en `studio_channel`:** `generatedProfile(row)`:
  - `name` es el de Twitch; `twitch.login`, el suyo.
  - `tagline` y `description` salen de la descripción de su Twitch, partida en frases. Si no tiene, «Canal de {name} en Twitch.».
  - `socials` lleva solo Twitch, con su URL. `rules` y `streams` van vacíos, y `schedule`, sin días.
  - `panels` son los que salen de sus propios datos: «De qué va» (de la descripción), «Horario», «Normas» (de las normas) y «Redes». Al aplicar se vio que en Recursos los paneles solo se editan, no se añaden: si empezaran vacíos no podría crearlos. `panelsOf` se salta los que no tienen nada que enseñar, así que «Normas» y «Redes» aparecen cuando haya normas o una red además de Twitch.
  - `scenes`, `alerts` y `camera` salen de unos textos genéricos de `lib/profile/generated.ts`, con su nombre donde toca.
  - `site`, `journey` y `banner` llevan textos neutros. No se ven, porque no tiene web.
- **Cualquier otro login:** `null`, que en los overlays da 404 y en la API de eventos, sin canal.

`loadProfile(login)` usa `baseProfileOf`. Las funciones que hoy llaman a `repoProfileOf` pasan a `await` y a tratar el `null`. `repoProfile()` se queda para la web pública.

Esto cambia lo que hoy hacen `lib/channel.ts`, `lib/overlay/channel.ts`, `api/studio/profile` y `api/events`.

### 4. Esquema: estricto para el repositorio, flexible para los generados

`profileSchema` relaja lo necesario: `youtube` pasa a ser opcional y `streams`, `rules` y `panels` admiten 0. `socials` y `description` siguen pidiendo al menos uno, que los generados cumplen.

`repoProfileSchema = profileSchema.extend(...)` vuelve a exigir `youtube` y al menos un elemento en `streams`, `rules` y `panels`. Lo usan `parseProfile`, el YAML y `validate-profile`. La web solo usa el principal, que pasa por `repoProfileSchema`, así que `lib/site.ts` puede afirmar `youtube` con un tipo `RepoProfile`.

**Descartado:** inventar un handle de YouTube o normas para los generados. Saldrían en sus paneles como si fueran suyos.

### 5. La sesión sabe su canal

`StudioSession` gana:
- `login`: el de la fila de `studio_channel` de su id.
- `admin`: si su id está en `STUDIO_ALLOWED_TWITCH_IDS`.

En el estudio, todo lo que hoy usa el canal principal pasa a usar el de la sesión:
- `overlays/page.tsx`: `loadProfile(session.login)`.
- `api/studio/settings`: las frases por defecto, del perfil de la sesión.
- `assets/page.tsx` y `api/studio/profile`: la base es `baseProfileOf(session.login)`. La comprobación del dueño compara el login de la sesión con el del perfil que se guarda, que siempre es el suyo, así que deja de hacer falta preguntar a Helix.
- `guide/page.tsx`: el perfil de la sesión, si usa alguno.

### 6. Id de un canal por su login

`channelIdOf(login)` mira primero `studio_channel`, que tiene el id sin preguntar a Twitch. Para el principal, si todavía no tiene fila, sigue con Helix y su caché. Así la API de eventos y los overlays funcionan para cualquier canal con acceso.

### 7. «Cuentas»

- **Página `/studio/accounts`**, solo para administradores; los demás van a Overlays. Tiene:
  - un campo «Usuario de Twitch» con el botón «Buscar», que hace `GET /api/studio/accounts?login=`, busca en Helix `/users?login=` y enseña una tarjeta con la foto, el nombre y la descripción, con «Darle acceso»;
  - la tabla de cuentas: foto y nombre, login, «Administrador» o «Añadida por X el …», y «Quitar acceso», con `Modal` de confirmación, salvo en los administradores.
- **`POST /api/studio/accounts { login }`**: busca de nuevo en Helix por si ha cambiado y crea la fila con `addedBy`. Si ya está, responde 409 con el mensaje.
- **`DELETE /api/studio/accounts?id=`**, en este orden:
  1. Borra las sesiones de better-auth de ese usuario: las suyas por `accountId` y `providerId: "twitch"`. Su `account` y su `user` se quedan, para que vuelva a entrar con lo suyo si se le vuelve a añadir.
  2. Da de baja sus suscripciones de EventSub con la función que ya usa «Desconectar».
  3. Borra la fila de `studio_channel`.

  Si falla la baja de EventSub, la fila se borra igual (lo importante es quitar el acceso) y el error se dice.
- **Seguridad:** toda la API comprueba `session.admin` y responde 403 si no lo es. El login se valida con `^\w{4,25}$` antes de ir a Twitch.

### 8. Navegación

`STUDIO_PAGES` gana «Cuentas» (`/studio/accounts`, icono `Users01`) con `adminOnly`. `StudioSidebar` recibe `admin` del layout del estudio y la filtra.

## Risks / Trade-offs

- **`mapProfileToUser` asíncrono:** si better-auth no lo admite, está el plan B de la decisión 2. → Se comprueba lo primero al aplicar.
- **Cambio de login en Twitch:** la fila se actualiza al entrar, pero las URLs que ya están en OBS llevan el login viejo y dejarán de funcionar. Pasa lo mismo hoy con el principal. → Se dice en la guía.
- **Las sesiones abiertas al quitar una cuenta:** se borran de la base de datos y better-auth deja de reconocer la cookie en la siguiente petición. → Cubierto con un e2e.
- **Muchos sitios usan el perfil:** cambiar `repoProfileOf` a asíncrono toca bastantes llamadas. → `tsc` las señala todas, y los e2e de overlays y de la web cubren las dos caras.
- **Textos genéricos de las escenas para los añadidos:** pueden no encajar con su canal. → Son un punto de partida. Editar los textos de escenas y alertas por canal no entra aquí, pero las frases de alerta ya se editan.

## Migration Plan

1. Migración de Prisma con `studio_channel`. `vercel-build` la aplica.
2. Al desplegar, la primera entrada de jotis_1 crea su fila como administrador.
3. jotis_1 añade a sunara__ desde «Cuentas». Ella entra, conecta los eventos y copia sus URLs.

Vuelta atrás: la 0.4.1 ignora la tabla y solo deja entrar a los de la configuración.

## Open Questions

Ninguna.
