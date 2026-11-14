# Tasks

El diseño de referencia es el lienzo «Scaena» de Claude Design (design.md, Context). Cada pantalla se compara con su tablero en claro, en oscuro y, si lo tiene, en móvil. Las reglas de regula.jotis.me siguen mandando.

## 1. Regula 0.8.0 sin cambios visibles

- [x] 1.1 Subir `@jotis-me/react` a 0.8.0 y quitar `@jotis-me/icons` de `package.json`. Verificar que `bun install` resuelve `@jotis-me/react@0.8.0`, `@jotis-me/tokens@0.8.0` y `@untitledui/icons`, y que `@jotis-me/icons` ya no está en `bun.lock`
- [x] 1.2 Migrar todos los iconos por nombre a componentes o nodos de `@untitledui/icons` en `app/`, `components/` y `lib/` (`icon="…"`, `iconLeading`/`iconTrailing` con cadena, `<Icon name>`, `IconName`), con nodos donde un Server Component pasa el icono a uno de cliente (design.md, decisión 1). Verificar que `rg 'icon(Leading|Trailing)?="' app components` no encuentra nada y que `bun run typecheck` pasa
- [x] 1.3 Iconos del perfil: dejar `icon:` en kebab-case en `content/channel.yaml` y traducirlo en `lib/profile` con un mapa cerrado de los iconos permitidos; un nombre fuera del mapa falla al validar. Verificar con un test en `lib/profile/profile.test.ts` que `icon: no-existe` hace fallar la validación con el nombre del panel
- [x] 1.4 Favicon: importar `appIconSvg` de `@jotis-me/react/app-icon` en `app/favicon.svg/route.ts`, y cambiar los `AppIcon letters="Sc" hue="lime"` por `AppIcon app="scaena"`. Verificar que `/favicon.svg` responde con el SVG sólido en lime
- [x] 1.5 Decidir los logos sociales: usar `@jotis-me/assets` si trae Twitch, YouTube y Discord; si no, dejar `SocialLogo` (design.md, decisión 2). Verificar que la decisión queda escrita en design.md y que los logos se ven igual en la web
- [x] 1.6 Pasar toda la batería sin tocar ninguna pantalla. Verificar que `bun run ci` y `bun run test:e2e` pasan, incluidas las comparaciones de `overlay-layout.spec.ts`, `mounted-scenes.spec.ts` y `scenes.spec.ts` sin regenerar referencias. Si alguna cambia por Regula 0.8, comparar con el tablero del grupo C del lienzo antes de aceptarla

## 2. Perfil del canal

- [x] 2.1 Añadir al esquema (`lib/profile/schema.ts`) `site.intro`, `site.footer` y `journey` con los cuatro pasos (`before`, `game`, `chatting`, `after`: `title`, `hint`, `heading`, `text`, `where`), y quitar `playSettings`. Incluir los textos nuevos en la comprobación de emojis. Verificar con tests en `lib/profile/profile.test.ts` que falta un paso → falla con su nombre, y que un emoji en `journey.after.text` → falla señalando ese paso
- [x] 2.2 Rellenar `content/channel.yaml` con los textos del lienzo: la frase de la web, el pie, los cuatro pasos, el panel «Vídeos», la descripción y la tercera norma (design.md, decisión 7). Mantener `jotis_1`. Verificar que `bun run validate-profile` pasa y que el panel «Vídeos» de `/studio/assets` muestra el texto nuevo

## 3. Cabecera, pie y aviso de la web

- [x] 3.1 Rehacer `SiteHeader` con `HeaderNav type="simple"`: marca con `AppIcon app="scaena"` y «Scaena», «Inicio» y «Vídeos» con `current` según la ruta, y botón de tema en las acciones. Borrar `SiteNav`. Verificar en `e2e/site.spec.ts` que en `/videos` «Vídeos» tiene `aria-current="page"` y que a 390 px el menú se recoge sin desplazamiento horizontal
- [x] 3.2 Pasar `ThemeToggle` a `ButtonUtility` con luna o sol y su nombre accesible, con la misma lógica de tema. Verificar que `e2e/theme.spec.ts` pasa (primer fotograma, cambio y elección recordada)
- [x] 3.3 Rehacer `SiteFooter` con `Footer type="large-02"`: marca, `site.footer`, columnas «El canal» (solo redes con enlace) y «Esta web», y «Scaena es parte de jotis.me.». Verificar en `e2e/site.spec.ts` que, con Discord sin invitación, el pie no lo enseña
- [x] 3.4 Ajustar `LiveBanner`: «En directo: título», «categoría, tiempo en emisión» y «Ver en Twitch» en `actions`, sin espectadores ni `/live`. Verificar en `e2e/site.spec.ts` que el aviso aparece con el directo simulado, se cierra y no vuelve en la misma visita, y que no usa colores de error

## 4. Portada

- [x] 4.1 Crear `components/web/home/Hero.tsx` (design.md, decisión 4): `StreamStatus`, franja habitual sin directo, lema como `h1`, `site.intro`, botón principal «Ver en Twitch» o «Entrar al directo», «Ver los vídeos» como secundario y `BrowserFrame` con la escena offline o la de juego en `ScaledPreview`. El ancla `#schedule` en esta sección. Verificar en `e2e/site.spec.ts` los escenarios «Visita sin directo» y «Visita en directo», y que `/live` sin directo lleva a `/#schedule` con la franja visible
- [x] 4.2 Crear `components/web/home/StreamJourney.tsx`: `ProgressSteps` con los cuatro pasos de `journey`, la escena del paso (`StreamScene` o `GameLayout`/`ChattingLayout` en `ScaledPreview`) con `aria-hidden` e `inert`, el texto del paso en `aria-live="polite"`, «Entrar en Discord» solo si hay invitación, y «Siguiente: …» o «Volver al principio». Verificar en `e2e/site.spec.ts` los escenarios «Recorrer los pasos», «Último paso» y «Escenas de muestra sin foco», y que a 390 px la escena cabe sin desplazamiento horizontal
- [x] 4.3 Crear `components/web/home/LatestVideos.tsx`: tres `LinkCard` con miniatura que llevan a `/videos?v=<id>`, «Ver todos los vídeos», y el estado vacío si no hay vídeos. Verificar en `e2e/site.spec.ts` que salen tres tarjetas con las respuestas de ejemplo de YouTube y que el enlace abre ese vídeo en `/videos`
- [x] 4.4 Montar la portada con las tres secciones en `app/(web)/(site)/page.tsx` y borrar `WhoPlays`, `WhenAndWhere`, `GameDiary` y `LiveBadge`. Verificar que `bun run build` pasa, que la portada tiene como mucho un botón principal con y sin directo, que pasa el `axe` de las e2e y que coincide con los tableros «Portada», «Portada en directo» y sus versiones móviles

## 5. Página de vídeos

- [x] 5.1 Añadir en `lib/youtube/title.ts` la línea de la tarjeta («Directo resubido. Cyberpunk 2077 #1, 3:12:40», «Editado, 10:04»). Verificar con tests en `lib/youtube/title.test.ts` los dos escenarios de tarjeta del delta de `channel-site`
- [x] 5.2 Rehacer `app/(web)/(site)/videos/page.tsx`: `PageHeader` con las pestañas (`Tabs button-gray sm`), el vídeo que suena con `ClickToPlay`, la rejilla de `LinkCard` sin el que suena, y `Pager` con «Más recientes» y «Anteriores». Borrar `VideoCard` y `VideoPagination`. Verificar en `e2e/videos.spec.ts` «Ver un vídeo» (el pulsado deja la rejilla), «Filtrar directos» y que no se pide nada a YouTube hasta pulsar
- [x] 5.3 Rehacer `loading.tsx` con `Skeleton` y `aria-busy`, y los estados vacío y error con `EmptyState` («Reintentar» principal, «Abrir YouTube» secundario). Verificar en `e2e/videos.spec.ts` los escenarios «Cargando», «Sin vídeos» y «Error de YouTube», y que coinciden con los tableros de vacío, carga y error

## 6. Estudio

- [x] 6.1 Armazón: `StudioSidebar` con `AppIcon app="scaena"`, iconos como nodo y `responsive`; borrar `StudioTopBar`; botón de tema en las acciones de `PageHeader` de cada página. Verificar en `e2e/studio.spec.ts` que no hay migas, que el botón de tema está en la cabecera de cada página y que la cuenta y «Salir» se ven sin desplazar
- [x] 6.2 Entrada (`/studio/login`): tarjeta centrada sobre `BackgroundPattern grid-dot`, con el aviso de cuenta sin acceso dentro y el botón principal o secundario según el caso. Verificar en `e2e/studio-login.spec.ts` los dos casos y que coinciden con los tableros «Entrada» y «Cuenta sin acceso»
- [x] 6.3 Overlays, parte de arriba: tarjetas «Token de los overlays» (con «Rotar token» y su `Modal`) y «Alertas de prueba», y la indicación de OBS en la descripción de `PageHeader`. Verificar en `e2e/studio.spec.ts` que cancelar el modal no cambia el token y que confirmarlo muestra el nuevo
- [x] 6.4 Overlays, fuentes: partir `OverlaySources` en tarjetas por fuente con `CardHeader`, vista previa en `TransparencyGrid` oscuro con `ScaledPreview`, opciones (con `NumberInput` para la cuenta atrás), frases dentro de «Alertas», y la URL en `Input` con «Copiar». Pestañas «Piezas» y «Escenas» con `?tab=scenes`. Verificar en `e2e/studio.spec.ts` los tres escenarios del delta de `obs-overlays`, que guardar una frase con `{nombre}` sigue fallando con los huecos válidos, y que coincide con los tableros «Overlays - piezas» y «Overlays - escenas»
- [x] 6.5 Recursos: tarjeta del banner con «Exportar PNG» en `CardHeader`, `SectionHeader` «Paneles», rejilla de paneles con su enlace copiable y su nota, y «Exportar todo» en `PageHeader`. Verificar que `e2e/assets.spec.ts` pasa (PNG de 640 px, `banner.png` de 1200×480) y que coincide con el tablero «Recursos»
- [x] 6.6 Conexión: sin conectar con `EmptyState` y los permisos como `Badge`; conectado con la tarjeta de la cuenta y la `Table`; revocada con el `Alert` arriba y «Reactivar» en su fila. Verificar los tres estados y que coinciden con los tres tableros de conexión. (Hecho con `components/studio/ConnectionView.test.tsx` en lugar de e2e: el estado sale de Twitch y las e2e no tienen un Twitch falso. La vista se ha sacado a `ConnectionView`, que recibe las acciones por props.)
- [x] 6.7 Mantener `EventsNotice` arriba en overlays y recursos. Verificar que los escenarios de «Aviso de eventos sin conectar» de `twitch-events` siguen pasando

## 7. Cierre

- [x] 7.1 Pasar todo junto. Verificar que `bun run ci` y `bun run test:e2e` pasan y que `rg '@jotis-me/icons|<Icon ' app components lib` no encuentra nada
- [ ] 7.2 Revisar a mano cada pantalla de los grupos A y B del lienzo en claro, en oscuro y a 390 px, contra la guía de Regula: un principal por vista, «En directo» sin rojo, foco visible y voz de la suite. Verificar que la lista queda sin fallos o con cada diferencia apuntada y aceptada por el usuario
- [x] 7.3 Verificar que `openspec validate apply-new-scaena-design --strict` pasa

## Workflow follow-up

- Archivar antes `create-scaena` (le quedan 6.6 y las comprobaciones de despliegue 11.x), porque los deltas de este cambio modifican requisitos que todavía viven en él.
- Después, archivar este cambio con `/opsx:archive`.
