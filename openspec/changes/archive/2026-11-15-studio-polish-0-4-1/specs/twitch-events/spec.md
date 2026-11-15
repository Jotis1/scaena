## ADDED Requirements

### Requirement: Cuenta conectada con su foto
En Conexión, la tarjeta «Cuenta conectada» SHALL enseñar la foto de perfil de la cuenta de Twitch de la sesión, la misma que la cabecera. Solo si Twitch no da foto SHALL enseñar la inicial del nombre.

#### Scenario: Con foto
- **WHEN** la cuenta de Twitch de la sesión tiene foto de perfil y se abre Conexión
- **THEN** la tarjeta «Cuenta conectada» enseña esa foto y no la inicial

#### Scenario: Sin foto
- **WHEN** la cuenta de Twitch de la sesión no tiene foto y se abre Conexión
- **THEN** la tarjeta enseña la inicial del nombre

## MODIFIED Requirements

### Requirement: Conexión del canal
La entrada al estudio con Twitch SHALL pedir los permisos mínimos para leer follows, suscripciones, bits y metas del creador. Desde la página de conexión del estudio, el dueño del canal SHALL poder dar de alta y borrar las suscripciones de eventos del canal. Si al token actual de la sesión le falta un permiso, según Twitch, la página de conexión SHALL decir cuál falta y ofrecer volver a entrar con Twitch; si Twitch no contesta, no SHALL avisar.

#### Scenario: Primera conexión
- **WHEN** el dueño del canal ha entrado con Twitch y pulsa "Conectar eventos"
- **THEN** el sistema da de alta follows, suscripciones, renovaciones, regalos, raids entrantes, bits y el inicio, el progreso y el final de las metas, y la página de conexión los muestra como activos

#### Scenario: Reconexión sin duplicar
- **WHEN** se repite la conexión con las suscripciones ya activas
- **THEN** el sistema no crea suscripciones repetidas

#### Scenario: Falta el permiso de metas
- **WHEN** el dueño del canal entró antes de pedirse el permiso de metas y abre la página de conexión
- **THEN** la página dice que falta el permiso para leer las metas y ofrece «Volver a entrar con Twitch»

#### Scenario: Tras volver a entrar
- **WHEN** al dueño del canal le faltaba el permiso de metas, vuelve a entrar con Twitch dándolo y abre la página de conexión
- **THEN** la página ya no dice que falte ningún permiso

#### Scenario: Twitch no contesta
- **WHEN** Twitch no contesta al preguntar los permisos del token y se abre la página de conexión
- **THEN** la página no avisa de ningún permiso
