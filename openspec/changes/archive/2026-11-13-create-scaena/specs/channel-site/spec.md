# Spec Delta

## Purpose

Web pública del canal en `scaena.jotis.me`: cuenta de qué va el canal, cuándo se emite y dónde verlo, lleva al directo cuando lo hay y reúne los directos resubidos a YouTube.

## ADDED Requirements

### Requirement: Portada del canal
La portada SHALL contar el canal de arriba abajo, según el diseño aprobado y a partir del perfil del canal:
1. Quién juega y cómo: lema, enlace al canal de Twitch, descripción y "Ajustes de partida".
2. "Cuándo suelo estar": la franja habitual y qué se emite.
3. "Dónde verlo": Twitch, YouTube y Discord, con el estado actual del directo.
4. "Diario de partidas": los seis últimos vídeos y un enlace a todos.

#### Scenario: Visita sin directo
- **WHEN** alguien abre la portada y el canal está offline
- **THEN** ve las cuatro secciones en ese orden, y en "Dónde verlo" se lee "Ahora mismo, sin directo"

### Requirement: Ajustes de partida sin controles
"Ajustes de partida" SHALL mostrarse como una lista fija de filas con icono y texto. MUST NOT usar controles que se puedan enfocar o pulsar.

#### Scenario: Recorrer con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** el foco no se detiene en ninguna fila de "Ajustes de partida"

### Requirement: Aviso de directo
Cuando el canal está en directo, la web SHALL mostrar arriba, a todo el ancho, un aviso con el título, la categoría, el tiempo en emisión y los espectadores. El aviso SHALL llevar un botón que lleva a Twitch y el enlace corto `/live`, y SHALL poder cerrarse. Debe aparecer o irse sin recargar la página como mucho un minuto después del cambio.

#### Scenario: Empieza el directo con la web abierta
- **WHEN** la portada está abierta y el canal empieza a emitir
- **THEN** en menos de un minuto aparece el aviso con el botón "Ver en Twitch"

#### Scenario: Cerrar el aviso
- **WHEN** se cierra el aviso durante un directo
- **THEN** el aviso no vuelve a aparecer en esa visita, y "Dónde verlo" sigue indicando "En directo ahora"

### Requirement: Enlace corto al directo
El sistema SHALL servir una ruta `/live` que redirige al canal de Twitch si hay directo y, si no, a la portada con el horario visible.

#### Scenario: Directo activo
- **WHEN** alguien abre `/live` con el canal en directo
- **THEN** se le redirige a `twitch.tv/<canal>`

#### Scenario: Sin directo
- **WHEN** alguien abre `/live` con el canal offline
- **THEN** se le lleva a la portada, a la sección del horario

### Requirement: Página de vídeos
El sistema SHALL servir una página con todos los vídeos del canal, paginada de doce en doce con "Más recientes" y "Anteriores", y filtrable por "Todos", "Directos" y "Editados". Cada tarjeta SHALL mostrar miniatura, duración, tipo y título, y en los directos también juego y número. Cada vídeo SHALL abrirse en YouTube o en un reproductor de YouTube integrado que no carga nada de YouTube hasta que se pulsa.

#### Scenario: Ver un vídeo
- **WHEN** se pulsa la miniatura de un vídeo
- **THEN** el vídeo empieza a reproducirse en la propia página, arriba, con su título, sus datos y "Abrir en YouTube"

#### Scenario: Filtrar directos
- **WHEN** se elige "Directos"
- **THEN** solo aparecen los vídeos cuyo tipo es "Directo resubido", y la paginación cuenta solo esos

#### Scenario: Tarjeta de un directo
- **WHEN** un vídeo se titula "La ciudad que nunca duerme - Cyberpunk 2077 #1"
- **THEN** su tarjeta muestra "La ciudad que nunca duerme", "Directo resubido" y "Cyberpunk 2077 - #1"

#### Scenario: Sin vídeos
- **WHEN** el listado de vídeos está vacío
- **THEN** la página muestra un estado vacío con enlace al canal de YouTube

### Requirement: Diseño de la suite
Las páginas de la web y del estudio SHALL seguir el diseño aprobado y las reglas de regula.jotis.me: solo tokens, iconos y componentes de Regula, cabecera con el icono de app "Sc" y el nombre "Scaena" en lugar de "jotis.me", con el mismo estilo que la guía da a "jotis.me" (Bricolage Grotesque bold, `text-primary`). Las páginas SHALL ser usables con teclado y lector de pantalla.

#### Scenario: Cabecera de la app
- **WHEN** se abre cualquier página de la web o del estudio
- **THEN** la cabecera muestra el icono "Sc" y "Scaena" en Bricolage Grotesque bold, y no "jotis.me"

#### Scenario: Navegación con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** todos los enlaces y botones reciben el foco visible en orden de lectura

### Requirement: Claro y oscuro
Las páginas SHALL tener en la cabecera un único botón para cambiar entre claro y oscuro, con icono de luna en claro y de sol en oscuro, y con nombre accesible. La elección SHALL recordarse entre visitas. Sin elección guardada, el tema SHALL seguir la preferencia del sistema. El tema SHALL aplicarse antes de pintar la página, sin destello del contrario.

#### Scenario: Primera visita con el sistema en oscuro
- **WHEN** alguien sin elección guardada abre la web con el sistema en modo oscuro
- **THEN** la web se muestra desde el primer fotograma en oscuro y el botón muestra el sol

#### Scenario: Cambiar de tema
- **WHEN** se pulsa el botón con la web en claro
- **THEN** la web pasa a oscuro sin recargar y el botón pasa a mostrar el sol

#### Scenario: Elección recordada
- **WHEN** se elige claro, se cierra la web y se vuelve a abrir con el sistema en oscuro
- **THEN** la web se abre en claro

### Requirement: URLs en inglés
Todas las rutas, anclas y parámetros de URL de la web, el estudio, los overlays y la API SHALL estar en inglés, aunque el texto de la página esté en castellano.

#### Scenario: Ruta del directo
- **WHEN** se comparte el enlace corto al directo
- **THEN** es `scaena.jotis.me/live`

### Requirement: Una acción principal
Cada vista SHALL tener como mucho un botón de jerarquía principal; el resto SHALL ser secundario o terciario.

#### Scenario: Portada en directo
- **WHEN** la portada muestra el aviso de directo
- **THEN** la vista tiene como mucho un botón principal

#### Scenario: Error de YouTube
- **WHEN** la página de vídeos no puede cargar la lista
- **THEN** "Reintentar" es el único botón principal y "Abrir YouTube" va como secundario

### Requirement: "En directo" sin rojo
El estado "en directo" MUST mostrarse con el color de marca y la palabra "En directo", y MUST NOT usar los colores de error.

#### Scenario: Aviso de directo
- **WHEN** aparece el aviso de directo
- **THEN** lleva la palabra "En directo" con el acento índigo, sin rojo

### Requirement: Textos con la voz de la suite
Los textos SHALL estar en castellano de España con tuteo y frases cortas, mayúscula solo al principio, verbos en los botones y sin emojis ni signos de exclamación. Cifras y fechas SHALL ir en formato español.

#### Scenario: Fecha y cifra
- **WHEN** la página de vídeos muestra un vídeo publicado el 29 de octubre de 2026 y el aviso muestra 1284 espectadores
- **THEN** se lee "29 oct 2026" y "1.284"

#### Scenario: Estado vacío
- **WHEN** no hay vídeos
- **THEN** el estado vacío usa la voz de la suite (cercana, humor seco) y no "No se encontraron resultados"

### Requirement: Metadatos para compartir
Cada página SHALL tener título, descripción e imagen para redes a partir del perfil del canal.

#### Scenario: Compartir la portada
- **WHEN** se pega el enlace de la portada en una red social
- **THEN** la vista previa muestra el nombre del canal, su descripción corta y el banner
