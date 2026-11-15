# Design

## Context

- **Pestañas «Piezas / Escenas»** (`OverlaySources.tsx`, `Tabs type="button-border" fullWidth`). Medido en el navegador, la lista sí tiene sus 4 px de relleno. Lo que pasa es que la columna era `flex-[1_1_220px]` y las pestañas no encogen por debajo de su contenido: «Piezas 6» ocupa 99 px y «Escenas 6», 111. Con el relleno y la separación suman 222, así que «Escenas» se sale 2 px. Ya está corregido en el árbol.
- **Conexión** (`ConnectionView.tsx`): `AvatarLabel` recibe solo `initials`. La sesión (`StudioSession`) ya trae `image`, que usa la cabecera (`AccountMenu`), y `AvatarLabel` admite `src`.
- **Meta** (`GoalManager.tsx`): `apply()` pone `busy`, deshabilita los controles y espera al `PUT`. Hasta que contesta, el `Select` sigue con el valor anterior. `Select` no tiene estado de carga, pero Regula sí tiene `Spinner`.
- **Pestañas de las fuentes**: `Tabs orientation="vertical" type="button-gray"`. Por debajo de `lg`, Regula ya las cambia por un desplegable.

- **Pie** (`SiteFooter.tsx`): «Esta web» solo tiene «Inicio» y «Vídeos». El layout de la web ya lee la sesión para la cabecera.
- **Barra lateral** (`StudioSidebar.tsx`): `brand` pinta «Estudio · <sección>». En `SidebarNav`, `brand` es opcional.
- **Permisos** (`lib/studio/session.ts`): `scopes` sale de `listUserAccounts`, es decir, de `account.scope`. better-auth solo escribe ese campo al crear la cuenta y en `linkSocial`. Al volver a entrar con `signIn.social` lo deja como estaba, y su código lo dice: «`scope` intentionally omitted. Updated only via linkSocial». El token nuevo sí trae el permiso de metas, pero el aviso no se va nunca.

## Goals / Non-Goals

**Goals:**
- Que la pestaña elegida no se salga del marco.
- La foto de la cuenta en Conexión.
- Que el cambio de meta se vea al momento y se sepa si se ha guardado.
- Pestañas de línea en la lista de fuentes.
- Barra lateral sin título repetido.
- Que el aviso de permisos diga la verdad y se vaya al volver a entrar.
- Textos que digan cómo están las cosas, sin anunciar novedades (antes de la beta no hay a quién contárselas).

**Non-Goals:**
- Arreglar `Tabs` en Regula. El fallo es de ancho en Scaena, no de Regula.
- Estado optimista en el editor de cada meta: ahí ya está el botón «Guardar meta» con su `loading`.

## Decisions

### 1. Columna de 240 px

`flex-[1_1_240px]`, con un comentario que explica la cuenta. **Descartado:** dejar que las pestañas encojan con `min-w-0`, porque cortaría el texto o el contador. **Descartado también:** quitar el contador.

### 2. Foto en Conexión

`ConnectionView` y `ConnectionUnreachable` reciben `image?: string` y se lo pasan a `AvatarLabel` como `src`, con la inicial de respaldo. La página se lo pasa desde `session.image`.

### 3. Optimista en «Qué meta sale»

`GoalManager` guarda un `pending: GoalShow | null`:

- **Al cambiar:** se pinta `pending ?? panel.show`, y la vista previa también lo usa, porque se recalcula a partir de las metas que ya tiene el panel. El aviso de la meta de Twitch terminada se cierra al momento, como hará el servidor.
- **Mientras guarda:** junto al selector sale `<Spinner size="sm" />` con «Guardando…» (`role="status"`). Los controles no se deshabilitan: un segundo cambio sustituye al primero y gana la última respuesta, gracias a un contador de petición.
- **Al acabar:** con éxito, `onChange(panel)` y «Guardado», que se borra a los 2 s. Con error, `pending = null` (vuelve lo que había) y el mensaje del servidor en `role="alert"`.
- **Borrar una meta** sigue esperando al servidor, porque cambia la lista. Su botón usa `loading` en lugar de solo `disabled`.

La vista previa del estudio necesita la vista optimista. La regla de `goalOverview` pasa a una función pura, `viewOf` (en `goal-pick.ts`, sin nada de servidor), y el resumen del panel incluye `done`, cuándo cumplió cada meta su objetivo. Así el estudio calcula la misma vista que el servidor, incluidas las metas cumplidas que salen de la rotación.

**Descartado:** dejar `busy` y solo añadir el `Spinner`. Seguiría pareciendo que no pasa nada hasta que contesta.

### 4. Pestañas de línea

`type="line"` en las pestañas «Fuentes». En vertical, Regula ya dibuja la raya lateral. Hay que comprobar en las capturas que la columna de 240 px sigue bien alineada.

### 4b. Barra lateral sin título

Se quita `brand`. La cabecera ya marca «Estudio» y cada página tiene su `h1`. En el móvil, la barra de `SidebarNav` queda con el botón del menú, que se llama «Secciones del estudio». En las capturas a 390 px la franja quedaba con un menú hamburguesa solo, debajo del de la cabecera: dos iconos iguales sin pista de qué abre cada uno. Por eso `brand` lleva, solo por debajo de `lg`, «Secciones del estudio»: dice qué abre el botón sin repetir el estudio ni la página. En escritorio no hay título.

### 4c. «Estudio» en el pie

`SiteFooter` recibe `signedIn` del layout, que ya tiene la sesión, y añade «Estudio» a «Esta web»: `/studio/overlays` con sesión y `/studio/login` sin ella, la misma regla que `SiteHeader`. El pie solo sale en la web, no en el estudio, y así se queda.

### 5. Permisos según Twitch

`missingScopesFor(headers)`, en `lib/twitch/server.ts`:

1. Pide el token con `getAccessToken`, que lo renueva si hace falta, como ya hace `goalSyncDeps`.
2. Llama a `GET https://id.twitch.tv/oauth2/validate` con un límite de 2 s y compara sus `scopes` con `TWITCH_SCOPES`.
3. Si algo falla (sin token, 401, red o tiempo), devuelve `[]`: no se avisa sin estar seguros.

Solo lo usa la página de Conexión, que es la única que enseña el aviso. `StudioSession.scopes` desaparece. La lógica va en una función con `fetch` inyectable, para probarla con respuestas falsas.

- **Descartado: cambiar el botón a `linkSocial`.** Arreglaría la lista guardada para el futuro, pero no a quien ya volvió a entrar con `signIn`, como ahora. Además seguiría fiándose de una copia en vez de preguntar a Twitch, que también sabe si se ha revocado un permiso.
- **Descartado: `updateAccountOnSignIn`.** No incluye `scope`.

### 6. Textos sin novedades

- Aviso: «Para ver tus metas de Twitch hace falta un permiso que tu sesión no tiene. Vuelve a entrar con Twitch y después pulsa «Conectar eventos».». Con varios permisos, la lista en lugar de «ver tus metas de Twitch».
- Guía: «Si Conexión dice que falta un permiso, vuelve a entrar con Twitch.».

## Risks / Trade-offs

- **Vista previa optimista distinta de lo que sale en OBS:** solo si entre tanto ha cambiado algo en el servidor, por ejemplo una cuenta. → Se corrige con la respuesta.
- **Respuestas que llegan fuera de orden** si se cambia rápido. → Contador de petición: solo se aplica la última.
- **Una llamada más a Twitch al abrir Conexión.** Va con un límite de 2 s, y si Twitch no contesta no se enseña el aviso. → Se acepta: es una página que se abre poco.

## Migration Plan

Nada que migrar. Se despliega como 0.4.1 y se etiqueta `v0.4.1`.

## Open Questions

Ninguna.
