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

#### Scenario: URL con el origen delante
- **WHEN** se elige el chat en el estudio servido desde `https://scaena.jotis.me`
- **THEN** el campo de la URL enseña `https://scaena.jotis.me` como prefijo aparte y, a continuación, la ruta y los parámetros, en la fuente normal de la interfaz y no en monoespaciada

#### Scenario: Selector de lienzo con su relleno
- **WHEN** se elige una escena
- **THEN** cada botón del selector de lienzo tiene el mismo relleno a los dos lados de su texto y el grupo no queda recortado por la izquierda

### Requirement: Rotar el token
El estudio SHALL permitir rotar el token de overlay del canal tras una confirmación que avisa de que las URL viejas dejarán de funcionar. Tras rotarlo, las URL viejas MUST dejar de recibir eventos al momento.

#### Scenario: Cancelar la rotación
- **WHEN** se pulsa "Rotar token" y después se cancela la confirmación
- **THEN** el token no cambia

#### Scenario: Rotar
- **WHEN** se confirma la rotación
- **THEN** el estudio muestra el token nuevo y un overlay abierto con el viejo deja de recibir eventos

#### Scenario: Rotar con el campo deshabilitado
- **WHEN** se abre Overlays
- **THEN** el campo «Token de los overlays» está deshabilitado y el botón «Rotar», fuera del campo, sigue funcionando

### Requirement: Acceso al estudio con Twitch
Las páginas privadas (overlays, guía de uso, recursos y conexión) SHALL exigir entrar con una cuenta de Twitch autorizada, hoy solo la del canal jotis_1. Una cuenta no autorizada MUST NOT obtener sesión ni ver datos del estudio.

#### Scenario: Entra el dueño del canal
- **WHEN** jotis_1 pulsa "Entrar con Twitch" y autoriza la app
- **THEN** entra en el estudio y la sesión dura 30 días

#### Scenario: Entra otra cuenta
- **WHEN** otra cuenta de Twitch completa la autorización
- **THEN** ve que el estudio es privado y no se crea ninguna sesión

#### Scenario: Sin sesión
- **WHEN** alguien abre `/studio/overlays` sin sesión
- **THEN** se le lleva a `/studio/login`

### Requirement: Guía de montaje en OBS
El estudio SHALL tener una página privada, «Guía de uso», con una sección por escena montada (juego y Just Chatting) y una para las escenas de pantalla completa. Cada sección SHALL dar las fuentes que hay que añadir en OBS, en orden de capas de arriba abajo, con su posición y su tamaño en píxeles del lienzo elegido, y los ajustes de la fuente de navegador. Las medidas SHALL coincidir con las que usan las escenas. Las escenas montadas SHALL llevar además un esquema del lienzo a escala.

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

#### Scenario: Enlace antiguo
- **WHEN** se abre `/studio/guide?canvas=3440x1440#game`
- **THEN** se abre la «Guía de uso» en la sección de juego con el lienzo de 3440 × 1440

### Requirement: Meta editable en el estudio
El estudio SHALL dejar editar la meta propia del canal: tipo (suscripciones, seguidores o bits), texto, objetivo y lo que se lleva. Se usa cuando no hay meta activa en Twitch. Al guardarla, la pieza de meta y las escenas abiertas en OBS SHALL mostrarla sin recargar ni cambiar su URL. Cambiar el tipo, el texto o el objetivo SHALL conservar la cuenta; cambiar lo que se lleva SHALL fijarla. El objetivo SHALL ser un entero mayor que cero.

#### Scenario: Cambiar el objetivo en directo
- **WHEN** no hay meta activa en Twitch, la meta va por 290 de 300, la escena de juego está abierta en OBS y en el estudio se guarda el objetivo 350
- **THEN** la escena de juego pasa a mostrar 290 de 350 sin recargarse

#### Scenario: Corregir la cuenta
- **WHEN** la meta va por 290 y en el estudio se guarda que se llevan 250
- **THEN** la pieza de meta muestra 250 y sigue sumando desde ahí

#### Scenario: Objetivo no válido
- **WHEN** se intenta guardar la meta con el objetivo 0
- **THEN** el estudio no la guarda y dice que el objetivo tiene que ser mayor que cero

#### Scenario: URL antigua sin meta guardada
- **WHEN** no hay meta guardada ni meta de Twitch y se abre la pieza de meta con `type=follows&start=10&goal=50`
- **THEN** muestra la meta de seguidores en 10 de 50, como hasta ahora

#### Scenario: La meta guardada manda
- **WHEN** hay una meta de subs guardada, no hay meta de Twitch y se abre una URL de meta con `type=follows&goal=50`
- **THEN** la pieza muestra la meta de subs guardada

## ADDED Requirements

### Requirement: Token sin poder seleccionarse
Todo campo del estudio que enseñe el token, tapado o dentro de una URL, SHALL estar deshabilitado, de modo que su texto no se pueda seleccionar ni copiar a mano. Copiar la URL y rotar el token SHALL hacerse con botones aparte, que siguen activos.

#### Scenario: Copiar a mano no es posible
- **WHEN** en Overlays se intenta seleccionar con el ratón el texto de la URL de la escena de juego
- **THEN** el campo está deshabilitado, no se selecciona nada y el botón «Copiar» de al lado copia la URL con el token de verdad

### Requirement: Opciones de cada pieza en las escenas
En el detalle de las escenas de juego y Just Chatting, el estudio SHALL mostrar un bloque por pieza (estado, alertas, chat, eventos, meta y cámara) con su interruptor si es opcional y las mismas opciones que la pieza suelta. Desde la escena SHALL poder editarse la meta y las frases de alerta. La URL de la escena SHALL llevar las opciones de cada pieza y la escena SHALL aplicarlas.

#### Scenario: Filas de eventos en la escena
- **WHEN** en la escena de juego se ponen 3 filas en el bloque «Eventos»
- **THEN** la URL de la escena lleva `rows=3`, la vista previa enseña tres filas y la escena cargada en OBS también

#### Scenario: Editar la meta desde la escena
- **WHEN** en el bloque «Meta» de la escena de Just Chatting se guarda el objetivo 500
- **THEN** la meta se guarda como desde la pieza suelta, sin salir de la escena, y la vista previa enseña el objetivo 500

#### Scenario: Espectadores en el estado de la escena
- **WHEN** en la escena de juego se enciende «Enseñar espectadores» en el bloque «Estado»
- **THEN** la URL lleva `viewers=1` y el estado de la escena enseña los espectadores

### Requirement: Meta de Twitch
Si el canal tiene una meta del creador activa en Twitch, la pieza de meta y las escenas SHALL mostrar esa: su descripción como texto (o el de su tipo si no tiene), su objetivo y su progreso, al día en vivo. Al acabar en Twitch, SHALL volver la meta de Scaena. El estudio SHALL indicar qué meta sale y, con la de Twitch, que se edita en Twitch.

#### Scenario: Meta de Twitch activa
- **WHEN** el canal tiene en Twitch una meta de seguidores «Hacia los 1.000» que va por 950 de 1.000 y se abre la pieza de meta
- **THEN** la pieza muestra «Hacia los 1.000» con 950 de 1.000

#### Scenario: Progreso en vivo
- **WHEN** la meta de Twitch va por 950 y Twitch avisa de que va por 951
- **THEN** la pieza y las escenas abiertas pasan a 951 sin recargarse

#### Scenario: Acaba la meta de Twitch
- **WHEN** Twitch avisa de que la meta ha terminado y hay una meta de subs guardada en Scaena
- **THEN** la pieza pasa a mostrar la meta de subs guardada

#### Scenario: El estudio dice de dónde sale
- **WHEN** hay una meta de Twitch activa y se abre la meta en Overlays
- **THEN** el estudio dice que se está mostrando la meta de Twitch y que se cambia en el panel de creador de Twitch, y el editor de la meta de Scaena queda para cuando no haya ninguna

### Requirement: Cómo funciona y pasos a mano
La «Guía de uso» SHALL explicar cómo funciona Scaena (de Twitch a Scaena y de Scaena a OBS, para qué sirve el token y qué va solo) y SHALL dar la lista de lo que hay que hacer a mano: entrar y conectar eventos, poner el lienzo base en OBS, pegar las URL como fuentes de navegador, aplicar la máscara de la cámara y crear la meta en Twitch si se quiere usar la suya.

#### Scenario: Primeros pasos
- **WHEN** se abre la guía
- **THEN** hay una sección «Cómo funciona» y otra «Lo que hay que hacer a mano», y esta enlaza a la página de conexión

### Requirement: Trucos de OBS
La guía SHALL tener una sección «Trucos de OBS» con montajes que no son evidentes. Por lo menos SHALL explicar cómo tener la cámara con un filtro en una escena y sin él en otra: crear una escena con la cámara, añadir esa escena como fuente dentro de un grupo y poner el filtro en el grupo y no en la fuente, porque un filtro en la fuente cambia la cámara en todas las escenas.

#### Scenario: Cámara con y sin filtro
- **WHEN** se abre la sección «Trucos de OBS» de la guía
- **THEN** explica paso a paso el montaje de la escena con la cámara dentro de un grupo y por qué el filtro va en el grupo

### Requirement: Cambio de lienzo inmediato en la guía
Elegir el lienzo en la guía SHALL actualizar las medidas, los esquemas y el botón elegido en el momento, sin esperar al servidor, y SHALL dejar el lienzo en la URL de la página y la sección en la que se estaba.

#### Scenario: De 1080 a 1440
- **WHEN** en la guía se pulsa «3440 × 1440»
- **THEN** en menos de 200 ms el botón queda elegido y la cámara de la escena de juego pasa a 2.864, 1.088, y la URL lleva `canvas=3440x1440`
