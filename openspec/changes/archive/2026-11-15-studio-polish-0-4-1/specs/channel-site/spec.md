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
