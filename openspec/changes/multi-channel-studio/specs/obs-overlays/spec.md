## MODIFIED Requirements

### Requirement: Acceso al estudio con Twitch
Las páginas privadas (overlays, guía de uso, recursos, conexión y cuentas) SHALL exigir entrar con una cuenta de Twitch autorizada: un administrador o una cuenta añadida desde «Cuentas». Una cuenta no autorizada MUST NOT obtener sesión ni ver datos del estudio.

#### Scenario: Entra el dueño del canal
- **WHEN** jotis_1 pulsa "Entrar con Twitch" y autoriza la app
- **THEN** entra en el estudio y la sesión dura 30 días

#### Scenario: Entra una cuenta añadida
- **WHEN** sunara__, añadida desde «Cuentas», pulsa "Entrar con Twitch" y autoriza la app
- **THEN** entra en el estudio de su canal y la sesión dura 30 días

#### Scenario: Entra otra cuenta
- **WHEN** otra cuenta de Twitch completa la autorización
- **THEN** ve que el estudio es privado y no se crea ninguna sesión

#### Scenario: Sin sesión
- **WHEN** alguien abre `/studio/overlays` sin sesión
- **THEN** se le lleva a `/studio/login`

## ADDED Requirements

### Requirement: Cada canal con lo suyo
El estudio SHALL trabajar siempre con el canal de la sesión. Las URLs de Overlays SHALL llevar su usuario (`/overlay/<su usuario>/…`) y su token; las metas, las frases, la conexión de eventos, la guía y los textos de las escenas SHALL ser los suyos. Desde el estudio de un canal MUST NOT verse ni cambiarse nada de otro.

#### Scenario: URLs de sunara__
- **WHEN** sunara__ abre Overlays y copia la URL de la meta
- **THEN** la URL es `/overlay/sunara__/goal?token=…`, con su token, y en OBS enseña su meta

#### Scenario: Metas separadas
- **WHEN** sunara__ crea una meta de seguidores
- **THEN** la meta aparece en su estudio y en sus overlays, y no en los de jotis_1

#### Scenario: El token de otro no vale
- **WHEN** se abre `/overlay/jotis_1/goal` con el token de sunara__
- **THEN** la pieza no recibe nada, como con cualquier token que no es el del canal
