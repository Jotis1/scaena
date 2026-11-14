# Spec Delta

## MODIFIED Requirements

### Requirement: Portada del canal
La portada SHALL contar el canal de arriba abajo, según el diseño aprobado y a partir del perfil del canal, en tres secciones y en este orden:
1. Qué es la web: el estado del directo, el lema, una frase que explica la web, el botón a Twitch, el botón a los vídeos y un marco de navegador con lo que se vería ahora en Twitch (la escena offline sin directo, la escena de juego con directo).
2. "Cómo va un directo": cuatro pasos (antes, la partida, la charla, después), cada uno con su escena, su texto y dónde pasa (Twitch, YouTube o Discord).
3. "Lo último en YouTube": los tres últimos vídeos y un enlace a todos.

#### Scenario: Visita sin directo
- **WHEN** alguien abre la portada y el canal está offline
- **THEN** ve las tres secciones en ese orden, el estado "Sin directo" junto a "Suele haber directo de 17:00 a 20:00.", el botón "Ver en Twitch" y la escena offline en el marco

#### Scenario: Visita en directo
- **WHEN** alguien abre la portada con el canal en directo
- **THEN** el estado muestra "En directo" con el tiempo en emisión y la categoría, el botón principal dice "Entrar al directo" y el marco enseña la escena de juego

#### Scenario: Recorrer los pasos
- **WHEN** se pulsa el paso "La charla" en "Cómo va un directo"
- **THEN** se ven la escena de Just Chatting y su texto, el anuncio llega al lector de pantalla y el enlace de abajo dice "Siguiente: después"

#### Scenario: Último paso
- **WHEN** se está en el paso "Después" y se pulsa "Volver al principio"
- **THEN** vuelve a verse el paso "Antes"

#### Scenario: Escenas de muestra sin foco
- **WHEN** se recorre la portada con el tabulador
- **THEN** el foco no entra en las escenas del marco ni en las de los pasos, que son solo ilustración

### Requirement: Aviso de directo
Cuando el canal está en directo, la web SHALL mostrar arriba, a todo el ancho, un aviso de marca con "En directo:" y el título, la categoría y el tiempo en emisión, y un botón "Ver en Twitch". El aviso SHALL poder cerrarse. Debe aparecer o irse sin recargar la página como mucho un minuto después del cambio.

#### Scenario: Empieza el directo con la web abierta
- **WHEN** la portada está abierta y el canal empieza a emitir
- **THEN** en menos de un minuto aparece el aviso con el botón "Ver en Twitch"

#### Scenario: Cerrar el aviso
- **WHEN** se cierra el aviso durante un directo
- **THEN** el aviso no vuelve a aparecer en esa visita, y el estado de la portada sigue indicando "En directo"

### Requirement: Enlace corto al directo
El sistema SHALL servir una ruta `/live` que redirige al canal de Twitch si hay directo y, si no, a la portada con el horario visible.

#### Scenario: Directo activo
- **WHEN** alguien abre `/live` con el canal en directo
- **THEN** se le redirige a `twitch.tv/<canal>`

#### Scenario: Sin directo
- **WHEN** alguien abre `/live` con el canal offline
- **THEN** se le lleva a la portada, a la primera sección, donde se lee la franja habitual junto al estado del directo

### Requirement: Página de vídeos
El sistema SHALL servir una página con todos los vídeos del canal, paginada de doce en doce con "Más recientes" y "Anteriores", y filtrable por "Todos", "Directos" y "Editados". Arriba SHALL ir el vídeo que suena, con su tipo, título, datos y "Abrir en YouTube"; la rejilla de debajo MUST NOT repetirlo. Cada tarjeta SHALL mostrar miniatura, título y una línea con el tipo y la duración, y en los directos también juego y número. Cada vídeo SHALL abrirse en un reproductor de YouTube integrado que no carga nada de YouTube hasta que se pulsa.

#### Scenario: Ver un vídeo
- **WHEN** se pulsa la tarjeta de un vídeo de la rejilla
- **THEN** el vídeo empieza a reproducirse en la propia página, arriba, con su título, sus datos y "Abrir en YouTube", y deja de estar en la rejilla

#### Scenario: Filtrar directos
- **WHEN** se elige "Directos"
- **THEN** solo aparecen los vídeos cuyo tipo es "Directo resubido", y la paginación cuenta solo esos

#### Scenario: Tarjeta de un directo
- **WHEN** un vídeo de 3 h 12 min 40 s se titula "La ciudad que nunca duerme - Cyberpunk 2077 #1"
- **THEN** su tarjeta muestra "La ciudad que nunca duerme" y "Directo resubido. Cyberpunk 2077 #1, 3:12:40"

#### Scenario: Tarjeta de un editado
- **WHEN** un vídeo editado dura 10 min 4 s
- **THEN** su tarjeta muestra el título y "Editado, 10:04"

#### Scenario: Cargando
- **WHEN** la lista de vídeos todavía no ha llegado
- **THEN** la página muestra el hueco del reproductor y de las tarjetas como esqueletos, marcada como ocupada para el lector de pantalla

#### Scenario: Sin vídeos
- **WHEN** el listado de vídeos está vacío
- **THEN** la página muestra un estado vacío con enlace al canal de YouTube

### Requirement: Diseño de la suite
Las páginas de la web y del estudio SHALL seguir el diseño aprobado y las reglas de regula.jotis.me: solo tokens, iconos y componentes de Regula, cabecera con el icono de app de Scaena y el nombre "Scaena" en lugar de "jotis.me", con el mismo estilo que la guía da a "jotis.me" (Bricolage Grotesque bold, `text-primary`). La web SHALL llevar en la cabecera "Inicio" y "Vídeos", con la página actual marcada, y un pie con las redes del canal y las páginas de la web. Las páginas SHALL ser usables con teclado y lector de pantalla.

#### Scenario: Cabecera de la app
- **WHEN** se abre cualquier página de la web o del estudio
- **THEN** la cabecera muestra el icono de Scaena y "Scaena" en Bricolage Grotesque bold, y no "jotis.me"

#### Scenario: Página actual en la cabecera
- **WHEN** se abre la página de vídeos
- **THEN** "Vídeos" aparece marcado como página actual en la navegación de la cabecera

#### Scenario: Pie de la web
- **WHEN** se abre cualquier página de la web
- **THEN** el pie tiene la columna "El canal" con Twitch, YouTube y Discord (si tiene enlace), la columna "Esta web" con "Inicio" y "Vídeos", y "Scaena es parte de jotis.me."

#### Scenario: Navegación con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** todos los enlaces y botones reciben el foco visible en orden de lectura

#### Scenario: Móvil
- **WHEN** se abre la portada a 390 px de ancho
- **THEN** la navegación se recoge, las secciones se apilan y no hay desplazamiento horizontal

## REMOVED Requirements

### Requirement: Ajustes de partida sin controles
**Reason**: el diseño nuevo quita "Ajustes de partida" de la portada; lo que contaba (cómo se juega aquí) pasa al paso "La partida" de "Cómo va un directo".
**Migration**: ninguna para quien visita la web. En el perfil, el campo `playSettings` desaparece (ver `channel-profile`).
