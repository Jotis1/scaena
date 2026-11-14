# Spec Delta

## Purpose

Páginas pensadas para cargarse como fuente de navegador en OBS: cada pieza de la familia Stream de Regula en su propia URL, transparente, a tamaño de emisión y configurable sin tocar código.

## ADDED Requirements

### Requirement: Una URL por pieza
El sistema SHALL servir una página de overlay por pieza: chat, alerta, eventos recientes, meta, estado del directo y marco de cámara. También SHALL servir una por escena: "empezando", "vuelvo enseguida", "final" y "offline".

#### Scenario: Cargar el chat en OBS
- **WHEN** se añade la URL del overlay de chat como fuente de navegador
- **THEN** OBS muestra solo la caja de chat, sin cabecera, navegación ni barras de desplazamiento

### Requirement: Escenas montadas
El sistema SHALL servir dos escenas montadas a 1920×1080, "juego" y "Just Chatting", con las piezas colocadas según el diseño aprobado. Lo que va debajo (juego y cámara) lo pone OBS. Cada pieza opcional (chat, marco de cámara, eventos y meta) SHALL poder quitarse por parámetro.

#### Scenario: Centro libre en la escena de juego
- **WHEN** se carga la escena de juego
- **THEN** ninguna pieza fija ocupa la franja central, de 480 a 1440 px en horizontal

#### Scenario: Segundo plano sin perder contraste
- **WHEN** se carga la escena de Just Chatting
- **THEN** la meta y los eventos quedan debajo de la cámara, a plena opacidad

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
Las escenas SHALL dibujarse en un lienzo de 1920×1080 a escala 1:1 cuando la fuente mide 1920×1080. Las piezas sueltas SHALL tomar su tamaño por defecto de Regula y aceptar ancho y alto por parámetro.

#### Scenario: Escena a tamaño real
- **WHEN** la escena "empezando" se carga en una fuente de 1920×1080
- **THEN** ocupa exactamente la fuente sin recortes ni bordes

### Requirement: Configuración por parámetros de la URL
Cada overlay SHALL aceptar sus opciones por parámetros de la URL (por ejemplo, translúcido, desvanecido, número de filas, meta y unidad, fecha de la cuenta atrás) y SHALL ignorar los parámetros desconocidos o mal formados usando el valor por defecto.

#### Scenario: Cuenta atrás por URL
- **WHEN** la escena "empezando" se carga con una fecha objetivo dentro de diez minutos
- **THEN** la cuenta atrás muestra 10:00 y baja cada segundo

#### Scenario: Parámetro mal formado
- **WHEN** el overlay de eventos recibe `rows=abc`
- **THEN** muestra cinco filas, el valor por defecto

### Requirement: Página de URLs para copiar
El sistema SHALL ofrecer una página privada que liste cada overlay con su vista previa, sus opciones y la URL lista para pegar en OBS.

#### Scenario: Copiar URL configurada
- **WHEN** se elige "translúcido" para el chat en la página de URLs
- **THEN** la URL mostrada incluye esa opción y la vista previa la refleja

### Requirement: Acceso al estudio con Twitch
Las páginas privadas (overlays, recursos y conexión) SHALL exigir entrar con una cuenta de Twitch autorizada, hoy solo la del canal jotis_1. Una cuenta no autorizada MUST NOT obtener sesión ni ver datos del estudio.

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

### Requirement: Frases de alerta editables
El estudio SHALL permitir editar una frase por tipo de alerta (follow, sub, renovación, subs regaladas, raid y bits). Las frases pueden llevar huecos que se rellenan solos: `{meses}`, `{cantidad}`, `{espectadores}` y `{bits}`. Las frases se guardan por canal; sin frase guardada, se usa la del perfil del canal.

#### Scenario: Frase con hueco
- **WHEN** la frase de renovación es "{meses} meses ya. Gracias por seguir aquí." y alguien renueva por 14 meses
- **THEN** la alerta dice "14 meses ya. Gracias por seguir aquí."

#### Scenario: Hueco desconocido
- **WHEN** una frase lleva `{nombre}`, que no es un hueco válido
- **THEN** el estudio no la guarda y dice qué huecos se pueden usar

#### Scenario: Texto plano
- **WHEN** una frase contiene `<b>hola</b>`
- **THEN** la alerta muestra esos caracteres literalmente

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
