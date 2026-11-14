# Spec Delta

## MODIFIED Requirements

### Requirement: Diseño de la suite
Las páginas de la web y del estudio SHALL seguir el diseño aprobado y las reglas de regula.jotis.me: solo tokens, iconos y componentes de Regula, cabecera con el icono de app de Scaena y el nombre "Scaena" en lugar de "jotis.me", con el mismo estilo que la guía da a "jotis.me" (Bricolage Grotesque bold, `text-primary`). La web SHALL llevar una cabecera a todo el ancho con "Inicio" y "Vídeos", la página actual marcada con un subrayado, el selector de tema y el buscador, en ese orden a la derecha; y un pie con las redes del canal y las páginas de la web. Las páginas SHALL ser usables con teclado y lector de pantalla.

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
- **THEN** el pie tiene la columna "El canal" con Twitch, YouTube y Discord (si tiene enlace), la columna "Esta web" con "Inicio" y "Vídeos", y "Scaena es parte de jotis.me."

#### Scenario: Navegación con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** todos los enlaces y botones reciben el foco visible en orden de lectura

#### Scenario: Móvil
- **WHEN** se abre la portada a 390 px de ancho
- **THEN** la navegación se recoge, las secciones se apilan y no hay desplazamiento horizontal

### Requirement: Claro y oscuro
Las páginas SHALL tener en la cabecera un único selector de tema desplegable, con nombre accesible y tres opciones: "Claro", "Oscuro" y "Sistema". El botón que lo abre SHALL medir lo mismo sea cual sea el tema, para que la cabecera no se mueva al cambiar. La elección de "Claro" u "Oscuro" SHALL recordarse entre visitas. Con "Sistema", o sin elección guardada, el tema SHALL seguir la preferencia del sistema. El tema SHALL aplicarse antes de pintar la página, sin destello del contrario.

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

## ADDED Requirements

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
