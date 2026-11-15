## 1. Base de datos y acceso

- [x] 1.1 Modelo `StudioChannel` en `prisma/schema.prisma` y su migración. Aplicarla a la base de los e2e y limpiar la tabla en `e2e/global-setup.ts`.
- [x] 1.2 Comprobar si better-auth admite un `mapProfileToUser` asíncrono. Si sí, que deje entrar a los ids de la configuración y a los de `studio_channel`, y que haga `upsert` de la fila con login, nombre y foto. Si no, hacerlo en `databaseHooks.session.create.before`. Tests con una base falsa: admin, añadida, desconocida y cambio de login.
- [x] 1.3 `StudioSession` con `login` (de `studio_channel`) y `admin` (de la configuración). Que `e2e/session.ts` cree también la fila de `studio_channel`, con una opción para una cuenta añadida no administradora.

## 2. Perfil por canal

- [x] 2.1 Esquema: `profileSchema` con `youtube` opcional y `streams`, `rules` y `panels` de 0 o más; `repoProfileSchema`, estricto, para el YAML y `validate-profile`. Tests: el YAML sin YouTube falla y un perfil generado vale.
- [x] 2.2 `lib/profile/generated.ts`: `generatedProfile(row)` con lo de Twitch y los textos genéricos con su nombre. Tests: con descripción, sin ella, y que pasa el esquema.
- [x] 2.3 `baseProfileOf(login)`, asíncrona: el YAML para el principal, el generado para una fila de `studio_channel` y `null` para el resto. `loadProfile` la usa y se quita `repoProfileOf`. Pasar a `await` y tratar el `null` en `lib/channel.ts`, `lib/overlay/channel.ts`, la API de eventos y la de estado.
- [x] 2.4 `channelIdOf(login)`: primero `studio_channel` y, si no, Helix como ahora. Tests.
- [x] 2.5 La web pública con `RepoProfile` (`lib/site.ts`, metadatos, portada y vídeos), sin cambios de comportamiento.

## 3. Estudio del canal de la sesión

- [x] 3.1 Overlays, Guía y la API de frases con el perfil de la sesión (`loadProfile(session.login)`), y las URLs con su login.
- [x] 3.2 Recursos (página y `api/studio/profile`): la base es `baseProfileOf(session.login)`, y guardar y volver a los valores por defecto tocan solo su login. Actualizar los tests de `profile-edits`.
- [x] 3.3 e2e: una cuenta añadida (sunara__) ve en Overlays URLs con `/overlay/sunara__/`, su meta no sale en las de jotis_1, el token de una no vale en los overlays de la otra, y su Recursos empieza desde Twitch (Twitch falso en la base de pruebas: la fila ya trae nombre y descripción).

## 4. «Cuentas»

- [x] 4.1 `lib/twitch/users.ts`: `twitchUserByLogin(login)` con id, login, nombre, foto y descripción, desde Helix `/users?login=`. Tests con `fetch` falso.
- [x] 4.2 `lib/studio/accounts.ts`: listar, añadir (409 si ya está; error si no existe en Twitch) y quitar (borrar sesiones, dar de baja EventSub y borrar la fila; los administradores no se quitan), con dependencias inyectables. Tests.
- [x] 4.3 `app/api/studio/accounts/route.ts`: GET (lista o búsqueda con `?login=`), POST y DELETE, solo para administradores (403 si no). Tests de la propiedad.
- [x] 4.4 Página `/studio/accounts`: búsqueda con tarjeta y «Darle acceso», tabla con «Administrador» o «Añadida por … el …», y «Quitar acceso» con `Modal`. La página manda a Overlays a quien no es administrador.
- [x] 4.5 `STUDIO_PAGES` con «Cuentas» (`adminOnly`), y `StudioSidebar` la filtra con `admin`. Tests.
- [x] 4.6 e2e: el administrador ve «Cuentas» y la cuenta añadida no (403 en la API); quitar una cuenta con su sesión abierta la manda a la entrada; volver a añadirla recupera su meta.

## 5. Guía y versión

- [x] 5.1 Guía de uso: en «Lo que hay que hacer a mano», que si cambias de usuario en Twitch hay que volver a copiar las URLs.
- [x] 5.2 Pasar los tests unitarios y e2e, Biome, `check:colors`, `tsc`, el build y `openspec validate --strict` del cambio. Revisar las capturas de «Cuentas» y del estudio de una cuenta añadida.
- [x] 5.3 Subir la versión a 0.5.0 en `package.json`, abrir la PR, mergear en `main` y crear y subir la etiqueta anotada `v0.5.0`.
- [ ] 5.4 Después del despliegue: entrar como jotis_1, añadir a sunara__ desde «Cuentas» y avisar de que ya puede entrar, conectar eventos y copiar sus URLs.
