## MODIFIED Requirements

### Requirement: Eventos recientes y metas
El overlay de eventos SHALL mostrar los últimos eventos del más reciente al más antiguo, y el overlay de meta SHALL avanzar con los eventos del tipo que cuenta la meta (suscripciones, seguidores o bits) desde un valor inicial dado, con un texto propio. Con una meta guardada en el estudio, la cuenta SHALL llevarla el servidor: cada evento que cuenta SHALL sumar una sola vez aunque haya varios overlays abiertos o ninguno, y un overlay que se abre o reconecta SHALL mostrar la cuenta al día.

#### Scenario: Meta de subs
- **WHEN** la meta cuenta suscripciones, empieza en 284 y llega una sub regalada de 5
- **THEN** la meta muestra 289

#### Scenario: Eventos con OBS cerrado
- **WHEN** la meta guardada de seguidores va por 40, OBS está cerrado y llegan 3 follows durante una hora
- **THEN** al abrir OBS la meta muestra 43

#### Scenario: Dos overlays con la misma meta
- **WHEN** la pieza de meta y la escena de juego están abiertas a la vez y llega una sub
- **THEN** las dos suman 1, y la cuenta guardada sube 1
