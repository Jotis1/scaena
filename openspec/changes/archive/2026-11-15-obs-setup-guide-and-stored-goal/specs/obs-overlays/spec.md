## ADDED Requirements

### Requirement: Guía de montaje en OBS
El estudio SHALL tener una página privada, «Guía de OBS», con una sección por escena montada (juego y Just Chatting) y una para las escenas de pantalla completa. Cada sección SHALL dar las fuentes que hay que añadir en OBS, en orden de capas de arriba abajo, con su posición y su tamaño en píxeles del lienzo elegido, y los ajustes de la fuente de navegador. Las medidas SHALL coincidir con las que usan las escenas.

#### Scenario: Medidas de la escena de juego
- **WHEN** se abre la guía con el lienzo de 1920 × 1080
- **THEN** la sección de juego dice que la cámara va en x 1488, y 816, a 384 × 216, debajo de la fuente de la escena y encima del juego

#### Scenario: Medidas en ultrapanorámico
- **WHEN** en la guía se elige 3440 × 1440
- **THEN** la escena de juego se pone a 3440 × 1440 y la cámara va en x 2864, y 1088, a 512 × 288

#### Scenario: Enlace desde Overlays
- **WHEN** se pulsa «Cómo montarla» en la tarjeta de la escena de juego, con el lienzo de 3440 × 1440 elegido
- **THEN** se abre la guía en la sección de juego, con ese mismo lienzo

### Requirement: Máscara de la cámara
En la escena de juego, la guía SHALL ofrecer una máscara de cámara para descargar y los pasos para aplicarla en OBS con el filtro «Máscara de imagen/mezcla», de modo que las esquinas de la cámara no sobresalgan del marco redondeado. La máscara SHALL valer para cualquier cámara 16:9, a cualquier resolución y en los dos lienzos. En Just Chatting, la guía SHALL decir que no hace falta máscara.

#### Scenario: Descargar la máscara
- **WHEN** se pulsa «Descargar máscara» en la sección de juego
- **THEN** se descarga un PNG 16:9, blanco en un rectángulo con las esquinas redondeadas en la proporción del marco y transparente fuera

#### Scenario: Cámara con la máscara aplicada
- **WHEN** la cámara 16:9 está colocada como dice la guía y lleva la máscara
- **THEN** ninguna esquina de la cámara se ve por fuera del marco de la escena de juego

### Requirement: Meta editable en el estudio
El estudio SHALL dejar editar la meta del canal: tipo (suscripciones, seguidores o bits), texto, objetivo y lo que se lleva. Al guardar, la pieza de meta y las escenas de juego y Just Chatting abiertas en OBS SHALL mostrarla sin recargar la fuente ni cambiar su URL. Cambiar el tipo, el texto o el objetivo SHALL conservar la cuenta; cambiar lo que se lleva SHALL fijarla a ese valor. El objetivo SHALL ser un número entero mayor que cero.

#### Scenario: Cambiar el objetivo en directo
- **WHEN** la meta va por 290 de 300, la escena de juego está abierta en OBS y en el estudio se guarda el objetivo 350
- **THEN** la escena de juego pasa a mostrar 290 de 350 sin recargarse

#### Scenario: Corregir la cuenta
- **WHEN** la meta va por 290 y en el estudio se guarda que se llevan 250
- **THEN** la pieza de meta muestra 250 y sigue sumando desde ahí

#### Scenario: Objetivo no válido
- **WHEN** se intenta guardar la meta con el objetivo 0
- **THEN** el estudio no la guarda y dice que el objetivo tiene que ser mayor que cero

#### Scenario: URL antigua sin meta guardada
- **WHEN** no hay meta guardada y se abre la pieza de meta con `type=follows&start=10&goal=50`
- **THEN** muestra la meta de seguidores en 10 de 50, como hasta ahora

#### Scenario: La meta guardada manda
- **WHEN** hay una meta de subs guardada y se abre una URL de meta con `type=follows&goal=50`
- **THEN** la pieza muestra la meta de subs guardada

## MODIFIED Requirements

### Requirement: Acceso al estudio con Twitch
Las páginas privadas (overlays, guía de OBS, recursos y conexión) SHALL exigir entrar con una cuenta de Twitch autorizada, hoy solo la del canal jotis_1. Una cuenta no autorizada MUST NOT obtener sesión ni ver datos del estudio.

#### Scenario: Entra el dueño del canal
- **WHEN** jotis_1 pulsa "Entrar con Twitch" y autoriza la app
- **THEN** entra en el estudio y la sesión dura 30 días

#### Scenario: Entra otra cuenta
- **WHEN** otra cuenta de Twitch completa la autorización
- **THEN** ve que el estudio es privado y no se crea ninguna sesión

#### Scenario: Sin sesión
- **WHEN** alguien abre `/studio/overlays` sin sesión
- **THEN** se le lleva a `/studio/login`
