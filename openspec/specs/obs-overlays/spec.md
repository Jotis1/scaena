# obs-overlays Specification

## Purpose

Páginas pensadas para cargarse como fuente de navegador en OBS: cada pieza de la familia Stream de Regula en su propia URL, transparente, a tamaño de emisión y configurable sin tocar código.

## Requirements

### Requirement: Una URL por pieza
El sistema SHALL servir una página de overlay por pieza: chat, alerta, eventos recientes, meta, estado del directo y marco de cámara. También SHALL servir una por escena: "empezando", "vuelvo enseguida", "final" y "offline".

#### Scenario: Cargar el chat en OBS
- **WHEN** se añade la URL del overlay de chat como fuente de navegador
- **THEN** OBS muestra solo la caja de chat, sin cabecera, navegación ni barras de desplazamiento

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

### Requirement: Textos de las escenas
Las escenas SHALL mostrar la insignia, el titular y el subtítulo del perfil del canal para cada escena. La línea del pie de "final" y "offline" SHALL poder cambiarse por parámetro, y "empezando" y "vuelvo enseguida" SHALL aceptar la cuenta atrás en minutos.

#### Scenario: Cuenta atrás en minutos
- **WHEN** la escena "vuelvo enseguida" se carga con `minutes=8`
- **THEN** la cuenta atrás empieza en 08:00

### Requirement: Fondo transparente
Cada overlay SHALL tener el fondo de la página transparente; solo las piezas SHALL pintar fondo.

#### Scenario: Overlay sobre la cámara
- **WHEN** el overlay de alertas está encima de la fuente de cámara y no hay alerta activa
- **THEN** la cámara se ve completa, sin ningún velo

### Requirement: Siempre en oscuro
Los overlays SHALL dibujarse siempre con el tema oscuro de Regula, sea cual sea la preferencia del sistema de la máquina de OBS.

#### Scenario: OBS en un sistema claro
- **WHEN** el sistema donde corre OBS está en modo claro
- **THEN** el chat y las alertas se ven con los tokens oscuros

### Requirement: Textos y cifras de la suite
Los textos de los overlays SHALL seguir la voz de la suite (castellano de España, sin emojis, una broma por pantalla como mucho). Las cifras SHALL ir en formato español y las de reloj en Geist con números tabulares.

#### Scenario: Raid grande
- **WHEN** entra un raid de 1284 espectadores
- **THEN** la alerta dice "1.284"

#### Scenario: Cuenta atrás estable
- **WHEN** la cuenta atrás pasa de 10:00 a 09:59
- **THEN** los dígitos no cambian de ancho

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

### Requirement: Configuración por parámetros de la URL
Cada overlay SHALL aceptar sus opciones por parámetros de la URL (por ejemplo, translúcido, desvanecido, número de filas, meta y unidad, fecha de la cuenta atrás) y SHALL ignorar los parámetros desconocidos o mal formados usando el valor por defecto.

#### Scenario: Cuenta atrás por URL
- **WHEN** la escena "empezando" se carga con una fecha objetivo dentro de diez minutos
- **THEN** la cuenta atrás muestra 10:00 y baja cada segundo

#### Scenario: Parámetro mal formado
- **WHEN** el overlay de eventos recibe `rows=abc`
- **THEN** muestra cinco filas, el valor por defecto

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

### Requirement: Acceso con token
Los overlays que reciben eventos de Twitch SHALL exigir un token secreto en la URL. Son la alerta, los eventos recientes, la meta y las escenas montadas, que los incluyen. Si el token falta o no coincide, SHALL no recibir eventos y no mostrar las piezas de eventos. El chat y el estado, que son públicos en Twitch, no lo exigen.

#### Scenario: Token incorrecto
- **WHEN** se abre el overlay de alertas con un token que no es el configurado
- **THEN** la página queda transparente y no recibe eventos

#### Scenario: Escena montada sin token
- **WHEN** se abre la escena de juego sin token
- **THEN** se ven el chat, el estado y el marco de cámara, pero no las alertas, los eventos ni la meta

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

### Requirement: Movimiento según la guía
Las piezas que aparecen y se van SHALL usar solo el movimiento de entrada y salida de Regula y SHALL limitarse a un fundido cuando el sistema pida menos movimiento.

#### Scenario: Menos movimiento
- **WHEN** el navegador indica `prefers-reduced-motion`
- **THEN** las alertas aparecen solo con fundido, sin desplazamiento

### Requirement: Recuperación de la conexión
Los overlays en vivo SHALL reconectarse solos tras perder la conexión, sin recargar la fuente, y SHALL recibir al reconectar los eventos que se emitieron mientras estaban desconectados, siempre que no tengan más de diez minutos.

#### Scenario: Corte de red breve
- **WHEN** el overlay de eventos pierde la conexión 30 segundos y en ese tiempo llega un follow
- **THEN** al reconectar el follow aparece en la lista sin duplicarse

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

### Requirement: Máscara de la cámara
En la escena de juego, la guía SHALL ofrecer una máscara de cámara para descargar y los pasos para aplicarla en OBS con el filtro «Máscara de imagen/mezcla», de modo que las esquinas de la cámara no sobresalgan del marco redondeado. La máscara SHALL valer para cualquier cámara 16:9, a cualquier resolución y en los dos lienzos. En Just Chatting, la guía SHALL decir que no hace falta máscara.

#### Scenario: Descargar la máscara
- **WHEN** se pulsa «Descargar máscara» en la sección de juego
- **THEN** se descarga un PNG 16:9, blanco en un rectángulo con las esquinas redondeadas en la proporción del marco y transparente fuera

#### Scenario: Cámara con la máscara aplicada
- **WHEN** la cámara 16:9 está colocada como dice la guía y lleva la máscara
- **THEN** ninguna esquina de la cámara se ve por fuera del marco de la escena de juego

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
