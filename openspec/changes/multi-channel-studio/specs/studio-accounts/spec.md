## Purpose

Quién puede entrar al estudio de Scaena y cómo los administradores dan y quitan el acceso a otros canales desde el propio estudio, sin tocar la configuración del despliegue.

## ADDED Requirements

### Requirement: Administradores
Los administradores del estudio SHALL ser las cuentas cuyos ids de Twitch están en la configuración del despliegue. Un administrador SHALL poder entrar siempre y SHALL ver la sección «Cuentas». Una cuenta que no es administradora MUST NOT ver esa sección ni usar su API.

#### Scenario: El administrador ve «Cuentas»
- **WHEN** jotis_1, que está en la configuración, abre el estudio
- **THEN** la barra lateral tiene «Cuentas» y puede abrirla

#### Scenario: Una cuenta añadida no la ve
- **WHEN** sunara__, añadida desde «Cuentas», abre el estudio y luego `/studio/accounts`
- **THEN** la barra lateral no tiene «Cuentas» y la página la manda a Overlays; la API de cuentas le responde 403

### Requirement: Añadir una cuenta
En «Cuentas», un administrador SHALL poder añadir una cuenta escribiendo su usuario de Twitch. Scaena SHALL buscarla en Twitch y enseñar su nombre y su foto antes de confirmar. Al confirmarla, esa cuenta SHALL poder entrar en el estudio con su propio canal. Un usuario que no existe en Twitch SHALL dar un error claro sin añadir nada.

#### Scenario: Añadir a sunara__
- **WHEN** el administrador escribe «sunara__», ve su nombre y su foto y confirma
- **THEN** sunara__ aparece en la lista, con quién la añadió y cuándo, y al entrar con Twitch llega a su estudio

#### Scenario: Usuario que no existe
- **WHEN** el administrador escribe un usuario que no existe en Twitch
- **THEN** la página dice que no hay ninguna cuenta de Twitch con ese nombre y no añade nada

#### Scenario: Ya estaba
- **WHEN** el administrador añade una cuenta que ya está en la lista
- **THEN** la página dice que ya tiene acceso y no la repite

### Requirement: Quitar una cuenta
Un administrador SHALL poder quitar una cuenta añadida, con una confirmación. Al quitarla, sus sesiones SHALL cerrarse al momento y sus suscripciones de eventos de Twitch SHALL darse de baja. Sus datos, como el perfil, las metas, las frases y el token, SHALL conservarse, de modo que volver a añadirla lo recupere. Los administradores MUST NOT poder quitarse desde «Cuentas».

#### Scenario: Quitar a sunara__
- **WHEN** el administrador quita a sunara__ y confirma, con ella dentro del estudio
- **THEN** su siguiente página del estudio la lleva a la entrada; si vuelve a entrar con Twitch, ve que el estudio es privado; y Twitch deja de mandar eventos de su canal

#### Scenario: Volver a añadirla
- **WHEN** el administrador vuelve a añadir a sunara__
- **THEN** al entrar tiene su perfil, sus metas y su token como estaban

#### Scenario: Un administrador no se quita
- **WHEN** el administrador abre «Cuentas»
- **THEN** su propia fila no tiene el botón de quitar
