## ADDED Requirements

### Requirement: Navegación del estudio
Las páginas del estudio SHALL llevar la misma cabecera que la web, con "Estudio" como página actual y sus secciones dentro, y debajo una barra con las pestañas "Overlays", "Guía de OBS", "Recursos" y "Conexión", con la actual marcada, y la cuenta de la sesión con "Salir". El estudio MUST NOT tener barra lateral. La web pública SHALL seguir con su cabecera de siempre, sin "Estudio".

#### Scenario: Cambiar de sección
- **WHEN** en Overlays se pulsa la pestaña "Conexión"
- **THEN** se abre la página de conexión y "Conexión" queda marcada como actual en la barra de secciones

#### Scenario: Cuenta y salida a la vista
- **WHEN** se abre cualquier página del estudio
- **THEN** la barra de secciones muestra la cuenta de Twitch de la sesión y el botón "Salir", sin abrir ningún menú

#### Scenario: Estudio en el móvil
- **WHEN** se abre Overlays a 390 px de ancho
- **THEN** las pestañas de sección se pueden desplazar en horizontal dentro de su barra, la cuenta queda debajo y la página no se desplaza en horizontal

#### Scenario: La web no cambia
- **WHEN** se abre la portada con una sesión del estudio abierta
- **THEN** la cabecera tiene "Inicio" y "Vídeos", sin "Estudio"
