## MODIFIED Requirements

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
- **THEN** el pie tiene la columna "El canal" con Twitch, YouTube y Discord (si tiene enlace), la columna "Esta web" con "Inicio" y "Vídeos", y "Scaena es parte de jotis.me."

#### Scenario: Navegación con teclado
- **WHEN** se recorre la portada con el tabulador
- **THEN** todos los enlaces y botones reciben el foco visible en orden de lectura

#### Scenario: Móvil
- **WHEN** se abre la portada a 390 px de ancho
- **THEN** la navegación se recoge, las secciones se apilan y no hay desplazamiento horizontal

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

### Requirement: Navegación del estudio
Las páginas del estudio SHALL llevar la cabecera de la web, con "Estudio" como página actual, y una sola barra de navegación más: una barra lateral con "Overlays", "Guía de uso", "Recursos" y "Conexión", con la actual marcada. MUST NOT haber una segunda barra horizontal bajo la cabecera. En el móvil, la barra lateral SHALL recogerse en un menú que se abre con un botón.

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

## ADDED Requirements

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
