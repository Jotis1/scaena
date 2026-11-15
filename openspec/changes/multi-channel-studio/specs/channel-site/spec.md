## MODIFIED Requirements

### Requirement: Navegación del estudio
Las páginas del estudio SHALL llevar la cabecera de la web, con "Estudio" como página actual, y una sola barra de navegación más: una barra lateral con "Overlays", "Guía de uso", "Recursos" y "Conexión" y, solo para los administradores, "Cuentas", con la actual marcada. La barra lateral MUST NOT llevar un título que repita el estudio o la sección. MUST NOT haber una segunda barra horizontal bajo la cabecera. En el móvil, la barra lateral SHALL recogerse en un menú que se abre con un botón.

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

#### Scenario: «Cuentas» solo para administradores
- **WHEN** jotis_1, administrador, y sunara__, cuenta añadida, abren el estudio
- **THEN** la barra lateral de jotis_1 tiene "Cuentas" y la de sunara__ no
