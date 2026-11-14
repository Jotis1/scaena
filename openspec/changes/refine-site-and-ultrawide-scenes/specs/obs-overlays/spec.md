# Spec Delta

## MODIFIED Requirements

### Requirement: Lienzo de emisión
Las escenas SHALL dibujarse en un lienzo de 1920×1080 a escala 1:1 cuando la fuente mide 1920×1080. Las seis escenas SHALL aceptar además `canvas=3440x1440`, que las dibuja a 3440×1440 a escala 1:1, con las piezas a 4/3 de su tamaño en 1920×1080 para que conserven su proporción respecto a la altura. Sin `canvas`, o con un valor que no se reconoce, SHALL usarse 1920×1080. Las piezas sueltas SHALL tomar su tamaño por defecto de Regula y aceptar ancho y alto por parámetro.

#### Scenario: Escena a tamaño real
- **WHEN** la escena "empezando" se carga en una fuente de 1920×1080
- **THEN** ocupa exactamente la fuente sin recortes ni bordes

#### Scenario: Escena en ultrapanorámico
- **WHEN** la escena "offline" se carga con `canvas=3440x1440` en una fuente de 3440×1440
- **THEN** ocupa exactamente la fuente sin recortes ni barras, con el fondo y el pie de la escena hasta los bordes

#### Scenario: Lienzo no reconocido
- **WHEN** una escena se carga con `canvas=1234x567`
- **THEN** se dibuja a 1920×1080, como sin el parámetro

### Requirement: Escenas montadas
El sistema SHALL servir dos escenas montadas, "juego" y "Just Chatting", a 1920×1080 y, con `canvas=3440x1440`, a 3440×1440, con las piezas colocadas según el diseño aprobado. En ultrapanorámico, las piezas SHALL quedar pegadas a los mismos bordes que en 1920×1080 y el ancho que sobra SHALL ir al centro. Lo que va debajo (juego y cámara) lo pone OBS. Cada pieza opcional (chat, marco de cámara, eventos y meta) SHALL poder quitarse por parámetro.

#### Scenario: Centro libre en la escena de juego
- **WHEN** se carga la escena de juego
- **THEN** ninguna pieza fija ocupa la franja central, de 480 a 1440 px en horizontal

#### Scenario: Centro libre en ultrapanorámico
- **WHEN** se carga la escena de juego con `canvas=3440x1440`
- **THEN** ninguna pieza fija ocupa la franja central, de 640 a 2800 px en horizontal, y la alerta sale centrada

#### Scenario: Segundo plano sin perder contraste
- **WHEN** se carga la escena de Just Chatting
- **THEN** la meta y los eventos quedan debajo de la cámara, a plena opacidad

#### Scenario: Just Chatting en ultrapanorámico
- **WHEN** se carga la escena de Just Chatting con `canvas=3440x1440`
- **THEN** la cámara sigue arriba a la izquierda con su hueco transparente, el chat y la alerta van pegados a la derecha, y nada se solapa

#### Scenario: Escena de juego sin meta
- **WHEN** la escena de juego se carga con la meta desactivada
- **THEN** se ven el resto de piezas en su sitio y no hay hueco donde iba la meta

#### Scenario: Alerta en Just Chatting
- **WHEN** entra una alerta en la escena de Just Chatting
- **THEN** la alerta aparece encima del chat sin tapar los mensajes

### Requirement: Página de URLs para copiar
El sistema SHALL ofrecer una página privada que liste cada overlay con su vista previa, sus opciones y la URL lista para pegar en OBS. Los overlays SHALL repartirse en dos pestañas, "Piezas" (chat, alertas, eventos, meta, estado y cámara) y "Escenas" (juego, Just Chatting, empezando, vuelvo enseguida, final y offline), cada una con su número. La pestaña "Escenas" SHALL dejar elegir el lienzo, "1920 × 1080" o "3440 × 1440", para todas las escenas a la vez; las vistas previas, el tamaño de cada tarjeta y las URL SHALL reflejarlo. Cada URL SHALL llevar dentro de su campo un botón "Copiar". La indicación de cómo añadirlas en OBS SHALL ir una sola vez, en la cabecera de la página.

#### Scenario: Copiar URL configurada
- **WHEN** se elige "translúcido" para el chat en la página de URLs
- **THEN** la URL mostrada incluye esa opción y la vista previa la refleja

#### Scenario: Cambiar a escenas
- **WHEN** se pulsa la pestaña "Escenas"
- **THEN** se ven las seis escenas con su vista previa y su URL, y ninguna pieza suelta

#### Scenario: Escenas en ultrapanorámico
- **WHEN** en la pestaña "Escenas" se elige "3440 × 1440"
- **THEN** las seis URL llevan `canvas=3440x1440`, las tarjetas dicen "3440 × 1440" y las vistas previas pasan a 21:9

#### Scenario: Copiar una URL
- **WHEN** se pulsa "Copiar" en la URL de la escena de juego
- **THEN** la URL queda en el portapapeles y el botón confirma que se ha copiado
