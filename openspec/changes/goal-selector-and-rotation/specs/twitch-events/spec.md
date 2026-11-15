## MODIFIED Requirements

### Requirement: Eventos recientes y metas
El overlay de eventos SHALL mostrar los últimos eventos del más reciente al más antiguo. Cada meta de Scaena SHALL avanzar con los eventos de su tipo (suscripciones, seguidores o bits), salga o no. Con metas guardadas, la cuenta SHALL llevarla el servidor: cada evento que cuenta SHALL sumar una sola vez a cada meta de su tipo aunque haya varios overlays abiertos o ninguno, y un overlay al abrirse SHALL verla al día.

#### Scenario: Meta de subs
- **WHEN** la meta cuenta suscripciones, empieza en 284 y llega una sub regalada de 5
- **THEN** la meta muestra 289

#### Scenario: Eventos con OBS cerrado
- **WHEN** la meta guardada de seguidores va por 40, OBS está cerrado y llegan 3 follows durante una hora
- **THEN** al abrir OBS la meta muestra 43

#### Scenario: Dos overlays con la misma meta
- **WHEN** la pieza de meta y la escena de juego están abiertas a la vez y llega una sub
- **THEN** las dos suman 1, y la cuenta guardada sube 1

#### Scenario: La meta que no sale también cuenta
- **WHEN** sale la meta de subs, la de seguidores va por 40 y llegan 2 follows
- **THEN** al elegir la de seguidores muestra 42

#### Scenario: Dos metas del mismo tipo
- **WHEN** hay dos metas de Scaena de seguidores, una por 10 y otra por 500, y llega un follow
- **THEN** pasan a 11 y a 501

### Requirement: Seguimiento de la meta de Twitch
El sistema SHALL guardar todas las metas del creador activas del canal, cada una por su id: al conectar los eventos y al abrir el estudio SHALL pedirlas a Twitch y sustituir las guardadas, y con los avisos de inicio y progreso SHALL actualizar solo la meta del aviso. Un aviso de final SHALL borrar solo esa meta. Cada cambio SHALL llegar a los overlays abiertos con lo que tienen que pintar. Si Twitch no responde al pedirlas, SHALL conservar las que tenía.

#### Scenario: Empieza una meta en Twitch
- **WHEN** Twitch avisa de que empieza una meta de suscripciones de 0 a 50
- **THEN** queda guardada una meta de Twitch de suscripciones, 0 de 50, que el estudio ofrece en «Qué meta sale»

#### Scenario: Progreso repetido
- **WHEN** llega dos veces el mismo aviso de progreso, con 12 de 50
- **THEN** la meta queda en 12 de 50, no en 24

#### Scenario: Meta ya activa al conectar
- **WHEN** el canal ya tenía en Twitch una meta de seguidores por 950 de 1.000 y otra de bits por 200 de 500, y se pulsa "Conectar eventos"
- **THEN** quedan guardadas las dos, con sus cifras, sin esperar al siguiente aviso

#### Scenario: Dos metas a la vez
- **WHEN** hay guardadas una meta de Twitch de seguidores por 950 y otra de subs por 10, y llega un aviso de progreso de la de subs con 11
- **THEN** la de subs pasa a 11 y la de seguidores sigue en 950

#### Scenario: Acaba una de dos
- **WHEN** hay guardadas una meta de Twitch de seguidores y otra de subs, y Twitch avisa de que la de subs ha terminado
- **THEN** sigue guardada la de seguidores

#### Scenario: Tipos de meta de Twitch
- **WHEN** Twitch avisa de una meta de tipo `new_cheerer`
- **THEN** la meta se muestra con su descripción y la unidad «personas»
