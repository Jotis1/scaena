# channel-site Specification

## Purpose

Web pública del canal en `scaena.jotis.me`: cuenta de qué va el canal, cuándo se emite y dónde verlo, lleva al directo cuando lo hay y reúne los directos resubidos a YouTube.

## Requirements

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
El sistema SHALL servir una página con todos los vídeos del canal, paginada de doce en doce con "Más recientes" y "Anteriores", y filtrable por "Todos", "Directos" y "Editados" y por el texto buscado (`q`). Arriba SHALL ir el vídeo que suena, con su tipo, título, datos y "Abrir en YouTube"; la rejilla de debajo MUST NOT repetirlo. Cada tarjeta SHALL mostrar miniatura, título y una línea con el tipo y la duración, y en los directos también juego y número. Cada vídeo SHALL abrirse en un reproductor de YouTube integrado que no carga nada de YouTube hasta que se pulsa.

#### Scenario: Ver un vídeo
- **WHEN** se pulsa la tarjeta de un vídeo de la rejilla
- **THEN** el vídeo empieza a reproducirse en la propia página, arriba, con su título, sus datos y "Abrir en YouTube", y deja de estar en la rejilla

#### Scenario: Filtrar directos
- **WHEN** se elige "Directos"
- **THEN** solo aparecen los vídeos cuyo tipo es "Directo resubido", y la paginación cuenta solo esos

#### Scenario: Buscar dentro de un filtro
- **WHEN** se abre `/videos?type=live&q=cyberpunk`
- **THEN** solo aparecen los directos resubidos de Cyberpunk 2077, la paginación cuenta solo esos y cambiar de pestaña conserva la búsqueda

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
Las páginas de la web y del estudio SHALL seguir el diseño aprobado y las reglas de regula.jotis.me: solo tokens, iconos y componentes de Regula, y la marca con el icono de Scaena y "Scaena" en Bricolage Grotesque bold `text-primary`. La web SHALL llevar una cabecera a todo el ancho con "Inicio", "Vídeos" y "Estudio", la actual subrayada, y a la derecha el tema (o la cuenta) y el buscador; y un pie con las redes del canal y las páginas de la web. Todo SHALL ser usable con teclado y lector de pantalla.

#### Scenario: Cabecera de la app
- **WHEN** se abre cualquier página de la web o del estudio
- **THEN** la cabecera muestra el icono de Scaena y "Scaena" en Bricolage Grotesque bold, y no "jotis.me"

#### Scenario: Página actual en la cabecera
- **WHEN** se abre la página de vídeos
- **THEN** "Vídeos" aparece marcado como página actual en la navegación de la cabecera, con un subrayado y sin fondo resaltado

#### Scenario: Cabecera a todo el ancho
- **WHEN** se abre la portada a 1920 px de ancho
- **THEN** la marca queda pegada al margen izquierdo de la ventana y el buscador al derecho, no dentro de una columna centrada

#### Scenario: Pie de la web
- **WHEN** se abre cualquier página de la web
- **THEN** el pie tiene la columna "El canal" con Twitch, YouTube y Discord (si tiene enlace), la columna "Esta web" con "Inicio", "Vídeos" y "Estudio", y "Scaena es parte de jotis.me."

#### Scenario: Navegación con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** todos los enlaces y botones reciben el foco visible en orden de lectura

#### Scenario: Móvil
- **WHEN** se abre la portada a 390 px de ancho
- **THEN** la navegación se recoge, las secciones se apilan y no hay desplazamiento horizontal

#### Scenario: Estudio en el pie
- **WHEN** se abre la portada con una sesión del estudio abierta y, después, sin ella
- **THEN** "Estudio" del pie lleva a Overlays con sesión y a la entrada del estudio sin ella, como el de la cabecera

### Requirement: Claro y oscuro
Las páginas SHALL tener en la cabecera un único sitio para elegir el tema, con nombre accesible y tres opciones: "Claro", "Oscuro" y "Sistema". Sin sesión, es un selector desplegable cuyo botón mide lo mismo con cualquier tema. Con sesión, va dentro del menú de la cuenta. La elección de "Claro" u "Oscuro" SHALL recordarse entre visitas. Con "Sistema", o sin elección guardada, el tema SHALL seguir al sistema. El tema SHALL aplicarse antes de pintar, sin destello del contrario.

#### Scenario: Primera visita con el sistema en oscuro
- **WHEN** alguien sin elección guardada abre la web con el sistema en modo oscuro
- **THEN** la web se muestra desde el primer fotograma en oscuro y el selector marca "Sistema"

#### Scenario: Cambiar de tema
- **WHEN** se elige "Oscuro" en el selector con la web en claro
- **THEN** la web pasa a oscuro sin recargar y ningún elemento de la cabecera cambia de sitio

#### Scenario: Elección recordada
- **WHEN** se elige "Claro", se cierra la web y se vuelve a abrir con el sistema en oscuro
- **THEN** la web se abre en claro

#### Scenario: Volver a seguir al sistema
- **WHEN** con "Claro" guardado se elige "Sistema" y el sistema está en oscuro
- **THEN** la web pasa a oscuro y, al volver a abrirla, sigue al sistema

#### Scenario: Tema con sesión
- **WHEN** con una sesión del estudio abierta se abre el menú de la cuenta y se elige "Oscuro"
- **THEN** la web pasa a oscuro y en la cabecera no hay otro selector de tema

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

### Requirement: Buscador de vídeos
La cabecera de la web SHALL llevar un campo de búsqueda con nombre accesible. Al enviarlo SHALL llevar a la página de vídeos con el texto en `q`. La búsqueda SHALL encontrar vídeos y directos por título y por juego, sin distinguir mayúsculas ni tildes. En la página de vídeos, el campo SHALL mostrar el texto buscado.

#### Scenario: Buscar desde la portada
- **WHEN** se escribe "cyberpunk" en el buscador de la portada y se pulsa Intro
- **THEN** se abre `/videos?q=cyberpunk` con los vídeos cuyo título o juego contiene "Cyberpunk", y el campo conserva "cyberpunk"

#### Scenario: Sin tildes ni mayúsculas
- **WHEN** se busca "ciudad que nunca duerme" y el vídeo se titula "La Ciudad que Nunca Duerme"
- **THEN** el vídeo aparece entre los resultados

#### Scenario: Sin resultados
- **WHEN** la búsqueda no encuentra nada
- **THEN** la página muestra un estado vacío que repite el texto buscado y ofrece quitar la búsqueda, en vez de "Aún no hay vídeos"

#### Scenario: Búsqueda vacía
- **WHEN** se envía el buscador sin texto
- **THEN** se abre `/videos` con todos los vídeos

### Requirement: Navegación del estudio
Las páginas del estudio SHALL llevar la cabecera de la web, con "Estudio" como página actual, y una sola barra de navegación más: una barra lateral con "Overlays", "Guía de uso", "Recursos" y "Conexión", con la actual marcada. La barra lateral MUST NOT llevar un título que repita el estudio o la sección. MUST NOT haber una segunda barra horizontal bajo la cabecera. En el móvil, la barra lateral SHALL recogerse en un menú que se abre con un botón.

#### Scenario: Cambiar de sección
- **WHEN** en Overlays se pulsa "Conexión" en la barra lateral
- **THEN** se abre la página de conexión y "Conexión" queda marcada como actual en la barra lateral

#### Scenario: Una sola barra horizontal
- **WHEN** se abre cualquier página del estudio a 1280 px de ancho
- **THEN** bajo la cabecera de la web no hay ninguna otra barra de navegación horizontal

#### Scenario: Cuenta y salida a la vista
- **WHEN** se abre cualquier página del estudio
- **THEN** la cabecera enseña a la derecha el avatar de la cuenta de Twitch de la sesión, que abre el menú con "Cerrar sesión", y la barra lateral no repite la cuenta

#### Scenario: La web no cambia
- **WHEN** se abre la portada con una sesión del estudio abierta
- **THEN** la cabecera tiene "Inicio", "Vídeos" y "Estudio", con "Inicio" como actual, y no hay barra lateral

#### Scenario: Estudio en el móvil
- **WHEN** se abre Overlays a 390 px de ancho
- **THEN** la barra lateral no ocupa la pantalla, un botón abre el menú con las cuatro secciones y la página no se desplaza en horizontal

#### Scenario: Sin título repetido
- **WHEN** se abre Overlays
- **THEN** la barra lateral empieza con sus secciones y no enseña «Estudio · Overlays» ni otro título

### Requirement: Entrada al estudio desde la web
La cabecera de la web SHALL enseñar "Estudio" a todo el mundo. Sin sesión, SHALL llevar a la entrada con Twitch. Con sesión, SHALL llevar a Overlays. Entrar en el estudio SHALL seguir limitado a la cuenta autorizada.

#### Scenario: Estudio sin sesión
- **WHEN** alguien sin sesión pulsa "Estudio" en la cabecera de la portada
- **THEN** se abre `/studio/login`

#### Scenario: Estudio con sesión
- **WHEN** jotis_1, con sesión, pulsa "Estudio" en la cabecera de la página de vídeos
- **THEN** se abre `/studio/overlays`

### Requirement: Menú de la cuenta
Con una sesión del estudio abierta, la cabecera de la web y la del estudio SHALL enseñar a la derecha el avatar de la cuenta de Twitch, que abre un menú con el nombre de la cuenta, el tema y "Cerrar sesión". Cerrar sesión SHALL llevar a la portada sin sesión. Sin sesión, la cabecera MUST NOT enseñar ningún avatar.

#### Scenario: Cerrar sesión desde la web
- **WHEN** con sesión se abre el menú de la cuenta en la portada y se pulsa "Cerrar sesión"
- **THEN** la sesión se cierra, la portada se recarga sin el avatar y abrir `/studio/overlays` lleva a `/studio/login`

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión abre la portada
- **THEN** la cabecera enseña el selector de tema y ningún avatar
