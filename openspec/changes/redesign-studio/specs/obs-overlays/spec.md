## MODIFIED Requirements

### Requirement: Página de URLs para copiar
El sistema SHALL ofrecer una página privada, «Overlays», con la lista de fuentes repartida en «Piezas» (chat, alertas, eventos, meta, estado y cámara) y «Escenas» (juego, Just Chatting, empezando, vuelvo enseguida, final y offline), y el detalle de la fuente elegida: su vista previa, su URL con «Copiar», una nota sobre el token y sus opciones. La fuente elegida SHALL ir en la URL de la página. En las escenas, el detalle SHALL dejar elegir el lienzo y enlazar a la guía.

#### Scenario: Copiar URL configurada
- **WHEN** se elige el chat y se apaga «Fondo translúcido»
- **THEN** la URL mostrada lleva `translucent=0` y la vista previa enseña el chat opaco

#### Scenario: Cambiar a escenas
- **WHEN** se pulsa «Escenas»
- **THEN** la lista enseña las seis escenas, el detalle pasa a la escena de juego y la URL de la página lleva `source=game`

#### Scenario: Escenas en ultrapanorámico
- **WHEN** con una escena elegida se pone el lienzo en «3440 × 1440»
- **THEN** su URL lleva `canvas=3440x1440`, su tamaño dice «3440 × 1440», la vista previa pasa a 21:9 y el lienzo se conserva al elegir otra escena

#### Scenario: Copiar una URL
- **WHEN** se pulsa «Copiar» en la URL de la escena de juego
- **THEN** la URL queda en el portapapeles, con el token de verdad, y el botón confirma que se ha copiado

#### Scenario: Enlace antiguo a la pestaña de escenas
- **WHEN** se abre `/studio/overlays?tab=scenes`
- **THEN** el detalle enseña la escena de juego

#### Scenario: Token en la cabecera
- **WHEN** se abre la página
- **THEN** la cabecera enseña el token tapado salvo sus cuatro últimos caracteres, con el botón «Rotar»

### Requirement: Frases de alerta editables
El estudio SHALL permitir editar una frase por tipo de alerta (follow, sub, renovación, subs regaladas, raid y bits). Cada frase SHALL admitir solo los huecos de su tipo: `{meses}` la renovación, `{cantidad}` las subs regaladas, `{espectadores}` el raid y `{bits}` los bits; follow y sub, ninguno. Las frases se guardan por canal; sin frase guardada, se usa la del perfil del canal.

#### Scenario: Frase con hueco
- **WHEN** la frase de renovación es "{meses} meses ya. Gracias por seguir aquí." y alguien renueva por 14 meses
- **THEN** la alerta dice "14 meses ya. Gracias por seguir aquí."

#### Scenario: Hueco desconocido
- **WHEN** una frase lleva `{nombre}`, que no es un hueco válido
- **THEN** el estudio no la guarda y dice qué huecos se pueden usar

#### Scenario: Hueco de otra alerta
- **WHEN** la frase de bits lleva `{bit}` o la de follow lleva `{meses}`
- **THEN** el error sale bajo su campo mientras se escribe, dice qué huecos valen en esa alerta, «Guardar frases» queda desactivado y el servidor tampoco la guardaría

#### Scenario: Texto plano
- **WHEN** una frase contiene `<b>hola</b>`
- **THEN** la alerta muestra esos caracteres literalmente

#### Scenario: Frase guardada antes del cambio
- **WHEN** hay guardada una frase de follow con `{meses}`, de antes de que los huecos fueran por tipo
- **THEN** los overlays la siguen usando, y el estudio la marca como errónea hasta que se corrija

### Requirement: Guía de montaje en OBS
El estudio SHALL tener una página privada, «Guía de OBS», con una sección por escena montada (juego y Just Chatting) y una para las escenas de pantalla completa. Cada sección SHALL dar las fuentes que hay que añadir en OBS, en orden de capas de arriba abajo, con su posición y su tamaño en píxeles del lienzo elegido, y los ajustes de la fuente de navegador. Las medidas SHALL coincidir con las que usan las escenas. Las escenas montadas SHALL llevar además un esquema del lienzo a escala con sus capas.

#### Scenario: Medidas de la escena de juego
- **WHEN** se abre la guía con el lienzo de 1920 × 1080
- **THEN** la sección de juego dice que la cámara va en 1.488, 816, a 384 × 216, debajo de la fuente de la escena y encima del juego

#### Scenario: Medidas en ultrapanorámico
- **WHEN** en la guía se elige 3440 × 1440
- **THEN** la escena de juego se pone a 3.440 × 1.440 y la cámara va en 2.864, 1.088, a 512 × 288, y los esquemas pasan a 21:9

#### Scenario: Enlace desde Overlays
- **WHEN** se pulsa «Cómo montarla en OBS» en el detalle de la escena de juego, con el lienzo de 3440 × 1440 elegido
- **THEN** se abre la guía en la sección de juego, con ese mismo lienzo

#### Scenario: Índice de la guía
- **WHEN** se pulsa «Just Chatting» en el índice de la guía
- **THEN** la página baja a la sección de Just Chatting
