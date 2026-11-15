## MODIFIED Requirements

### Requirement: Meta editable en el estudio
El estudio SHALL dejar tener hasta 5 metas propias del canal, cada una con su tipo (suscripciones, seguidores o bits), texto, objetivo, unidad y lo que se lleva, y añadirlas, editarlas y borrarlas. Una vez creada la primera, SHALL quedar siempre al menos una. Al guardar, la pieza de meta y las escenas abiertas en OBS SHALL mostrar el cambio sin recargar ni cambiar su URL. Cambiar el tipo, el texto o el objetivo SHALL conservar la cuenta; cambiar lo que se lleva SHALL fijarla. El objetivo SHALL ser un entero mayor que cero.

#### Scenario: Cambiar el objetivo en directo
- **WHEN** sale la meta de subs, va por 290 de 300, la escena de juego está abierta en OBS y en el estudio se guarda el objetivo 350
- **THEN** la escena de juego pasa a mostrar 290 de 350 sin recargarse

#### Scenario: Corregir la cuenta
- **WHEN** la meta va por 290 y en el estudio se guarda que se llevan 250
- **THEN** la pieza de meta muestra 250 y sigue sumando desde ahí

#### Scenario: Objetivo no válido
- **WHEN** se intenta guardar una meta con el objetivo 0
- **THEN** el estudio no la guarda y dice que el objetivo tiene que ser mayor que cero

#### Scenario: Como mucho cinco
- **WHEN** el canal ya tiene 5 metas de Scaena
- **THEN** el estudio no deja añadir otra y dice que el máximo son 5

#### Scenario: No se borra la última
- **WHEN** el canal tiene una sola meta de Scaena
- **THEN** el estudio no deja borrarla

#### Scenario: La meta de antes sigue
- **WHEN** el canal tenía guardada una meta de subs por 290 de 300 antes de esta versión
- **THEN** es la primera de la lista, va por 290 de 300 y es la que sale

#### Scenario: URL antigua sin meta guardada
- **WHEN** el canal no tiene ninguna meta de Scaena guardada y se abre la pieza de meta con `type=follows&start=10&goal=50`
- **THEN** muestra la meta de seguidores en 10 de 50, como hasta ahora

#### Scenario: La meta guardada manda
- **WHEN** sale la meta de subs guardada y se abre una URL de meta con `type=follows&goal=50`
- **THEN** la pieza muestra la meta de subs guardada

### Requirement: Meta de Twitch
Las metas del creador activas en Twitch SHALL poder elegirse en «Qué meta sale» o entrar en la rotación; no SHALL salir ninguna sin elegirla. Una meta de Twitch que sale SHALL mostrar su descripción como texto (o el de su tipo si no tiene), su objetivo y su progreso, al día en vivo. Si acaba en Twitch la meta elegida, SHALL salir la meta de Scaena por defecto y el estudio SHALL avisar de que la elegida ha terminado. El estudio SHALL indicar que las metas de Twitch se editan en Twitch.

#### Scenario: Meta de Twitch activa
- **WHEN** el canal tiene en Twitch una meta de seguidores «Hacia los 1.000» que va por 950 de 1.000, se elige en «Qué meta sale» y se abre la pieza de meta
- **THEN** la pieza muestra «Hacia los 1.000» con 950 de 1.000

#### Scenario: Sin elegirla no sale
- **WHEN** el canal tiene una meta activa en Twitch y en «Qué meta sale» está la meta de subs de Scaena
- **THEN** la pieza y las escenas muestran la meta de subs de Scaena

#### Scenario: Progreso en vivo
- **WHEN** sale la meta de Twitch, va por 950 y Twitch avisa de que va por 951
- **THEN** la pieza y las escenas abiertas pasan a 951 sin recargarse

#### Scenario: Acaba la meta de Twitch
- **WHEN** sale la meta de Twitch elegida, Twitch avisa de que ha terminado y la primera meta de Scaena es la de subs
- **THEN** la pieza pasa a mostrar la meta de subs, y al abrir Overlays el estudio dice que la meta de Twitch elegida ha terminado

#### Scenario: Dos metas en Twitch
- **WHEN** el canal tiene en Twitch una meta de seguidores y otra de subs, sale la de seguidores y llega un aviso de progreso de la de subs
- **THEN** la pieza sigue mostrando la de seguidores, sin cambiar su cifra

#### Scenario: Acaba la otra meta de Twitch
- **WHEN** sale la meta de seguidores de Twitch y Twitch avisa de que la de subs ha terminado
- **THEN** la pieza sigue mostrando la de seguidores

#### Scenario: El estudio dice de dónde sale
- **WHEN** hay una meta de Twitch activa y se abre la meta en Overlays
- **THEN** el estudio la enseña en «En Twitch» con su progreso y dice que se cambia en el panel de creador de Twitch

## ADDED Requirements

### Requirement: Qué meta sale
El estudio SHALL tener un selector «Qué meta sale», común a la pieza de meta y a las escenas, con una opción por meta de Scaena, una por meta activa de Twitch y «Rotar». Cada opción SHALL llevar delante el icono de Scaena o el de Twitch, sin texto de prefijo. Por defecto SHALL salir la primera meta de Scaena. Al cambiarlo, la pieza y las escenas abiertas en OBS SHALL mostrar la elegida sin recargar ni cambiar su URL.

#### Scenario: Por defecto
- **WHEN** el canal tiene dos metas de Scaena, subs y seguidores, en ese orden, y nunca se ha tocado «Qué meta sale»
- **THEN** sale la meta de subs

#### Scenario: Cambiar en directo
- **WHEN** la escena de juego está abierta en OBS con la meta de subs y en el estudio se elige la de seguidores
- **THEN** la escena pasa a mostrar la meta de seguidores sin recargarse, y la pieza de meta abierta también

#### Scenario: Iconos de cada opción
- **WHEN** se abre «Qué meta sale» con una meta de Scaena y una de Twitch
- **THEN** la de Scaena lleva delante el icono de Scaena, la de Twitch el de Twitch, y ningún texto empieza por «Twitch ·» ni «Scaena ·»

#### Scenario: Borrar la meta que sale
- **WHEN** sale la segunda meta de Scaena y se borra
- **THEN** sale la primera meta de Scaena

### Requirement: Rotación de metas
Con «Rotar», el estudio SHALL dejar marcar qué metas entran, de Scaena y de Twitch, y el intervalo: 10, 20 o 30 segundos. La pieza y las escenas SHALL ir pasando por las metas marcadas en orden y SHALL enseñar la misma meta a la vez aunque se abrieran en momentos distintos. El cambio SHALL hacerse con un fundido, salvo con las animaciones apagadas. Una meta de Twitch que acaba SHALL salir de la rotación.

#### Scenario: Rotar dos metas
- **WHEN** se rota la meta de subs y la de seguidores cada 10 segundos
- **THEN** la pieza enseña una y, a los 10 segundos, la otra, y así sucesivamente

#### Scenario: Pieza y escena a la vez
- **WHEN** la rotación está en marcha y la pieza de meta y la escena de juego se abrieron con un minuto de diferencia
- **THEN** las dos enseñan la misma meta en cada momento

#### Scenario: Sin animaciones
- **WHEN** la escena de juego tiene las animaciones apagadas y la rotación pasa a la siguiente meta
- **THEN** la meta cambia sin fundido

#### Scenario: Acaba una meta de Twitch de la rotación
- **WHEN** rotan la meta de subs de Scaena y una meta de Twitch, y la de Twitch termina
- **THEN** solo sale la meta de subs

### Requirement: Meta cumplida en la rotación
Cada meta marcada en la rotación SHALL tener su opción para cuando pasa del objetivo: «Seguir» (por defecto) o «Sacar de la rotación». Con «Sacar», al llegar al objetivo SHALL dejar de salir en la rotación. Si todas las metas marcadas salen, SHALL quedarse la última que salió. La opción no SHALL afectar a una meta elegida fija, que se queda llena.

#### Scenario: Sacar al cumplirse
- **WHEN** rotan la meta de subs, con «Sacar de la rotación», y la de seguidores, y la de subs llega a su objetivo
- **THEN** solo sale la de seguidores

#### Scenario: Seguir al cumplirse
- **WHEN** rotan la meta de subs, con «Seguir», y la de seguidores, y la de subs pasa de su objetivo
- **THEN** las dos siguen rotando y la de subs se ve llena

#### Scenario: Todas cumplidas
- **WHEN** rotan dos metas con «Sacar de la rotación», primero llega a su objetivo la de seguidores y después la de subs
- **THEN** se queda la de subs, aunque se abra la pieza de nuevo

#### Scenario: Meta fija cumplida
- **WHEN** en «Qué meta sale» está la meta de subs y llega a su objetivo
- **THEN** la pieza sigue mostrando la meta de subs, llena
