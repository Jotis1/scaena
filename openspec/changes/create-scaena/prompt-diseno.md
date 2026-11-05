Diseña **Scaena**, la app de la suite jotis.me para mi canal de Twitch (twitch.tv/jotis_1), con el sistema de diseño **Jotis.me** y su guía. Si una pantalla necesita algo que el sistema no tiene, márcalo con una nota en el lienzo en lugar de inventarlo.

## Importante

- **Nombre en la cabecera.** No pongas "jotis.me". Pon "Scaena" con el mismo estilo que la guía da a "jotis.me", junto al icono "Sc".
- **Claro y oscuro.** Un único botón en la cabecera: luna cuando la página está en claro, sol cuando está en oscuro. Sin menús ni selectores de tres opciones.
- **URLs siempre en inglés**, aunque el texto de la página esté en castellano. Las que se vean en el diseño tienen que ser así, por ejemplo:
  - `scaena.jotis.me/live`;
  - `scaena.jotis.me/videos?page=2`;
  - `scaena.jotis.me/studio/assets`;
  - `scaena.jotis.me/overlay/jotis_1/chat?translucent=1`;
  - `scaena.jotis.me/overlay/jotis_1/goal?type=subs&start=284&goal=300&token=…`.
- **Que no sea genérico: que cuente una historia.** No quiero una plantilla de "página de streamer" con huecos rellenados. La web tiene que contar de qué va esto: jugar sin reloj, ver cada rincón, juegos que duran lo que tengan que durar.
  - Leída de arriba abajo, la portada debería sentirse como esa historia: quién juega y cómo, cuándo suele estar, si está ahora mismo y dónde verlo, y lo que ya ha quedado grabado en YouTube como el diario de esas partidas.
  - Esa misma idea tiene que notarse en las escenas, los paneles y el banner, para que todo parezca la misma voz.
  - Usa lo que la guía permite para dar carácter, sin salirte de ella.
  - Si para contarlo bien hace falta un dato que no tengo en el contenido de abajo (por ejemplo, horas por juego o juegos terminados), propónlo con una nota en lugar de inventarte cifras.

## Qué es Scaena

Tiene tres partes:

1. **Web pública** (scaena.jotis.me): de qué va el canal, cuándo emito, aviso y enlace al directo cuando lo hay, y mis vídeos de YouTube.
2. **Estudio** (privado; se entra con Twitch y hoy solo entro yo): las URL de los overlays para pegarlas en OBS, los paneles y el banner de Twitch para exportar, y la conexión con Twitch.
3. **Overlays de OBS**: fuentes de navegador con fondo transparente, montadas con la familia Stream.

## Contenido real (úsalo tal cual)

- **Canal**: jotis_1 en Twitch.
- **Lema corto**: "Juegos a mi ritmo, sin prisa."
- **De qué va**, en dos párrafos:
  - "Un canal para jugar sin reloj. Me paro a mirar el paisaje, vuelvo atrás por el cofre que me dejé y no cambio de zona hasta verla entera. Entre partida y partida, ratos de Just Chatting."
  - "Si te gusta ir con calma, quédate. Si tienes prisa, te entiendo, pero aquí no."
- **Qué se emite**: juegos y Just Chatting.
- **Horario**: no es fijo. "Normalmente de 17:00 a 20:00." Tiene que entenderse que es lo habitual, no una cita. Propón cómo mostrarlo en la portada y en el banner.
- **Redes**: solo YouTube (@jotis_1) y Discord. Los logos de YouTube, Discord y Twitch salen de svgl.app, en monocromo y con el color de icono que toque, nunca a todo color.
- **Normas del chat**:
  1. "Pórtate bien. Si no sabes cómo, la escuela sigue abierta."
  2. "Nada de spam."
  3. "Mi canal, mis normas: lo que no me parezca bien, fuera. Si te parece injusto, hay más canales."
- **Paneles de Twitch**: "De qué va", "Horario", "Normas", "Vídeos" (acción: ver en YouTube) y "Redes".
- **Escenas**: los textos por defecto de `StreamScene`, con canal "jotis_1" y handle "twitch.tv/jotis_1".
- **Datos de ejemplo**:
  - 1.284 espectadores, 2:14:05 en emisión, categoría "Elden Ring";
  - vídeos del canal: directos resubidos y editados, de hasta 3:12:40;
  - alertas de follow, sub de nivel 1, renovación de 14 meses, 5 subs regaladas, raid de 1.284 y 500 bits;
  - meta "Subs del mes", 284 de 300.

## Mesas de trabajo

**A. Web pública.** Escritorio a 1440 y móvil a 390, en claro y en oscuro:

1. Portada offline: cabecera, de qué va, horario, redes y los últimos seis vídeos.
2. Portada en directo: lo mismo, con un aviso arriba (estado, título, categoría y botón a Twitch).
3. Vídeos: rejilla paginada de doce, con un vídeo en reproducción integrada; estados vacío, carga y error de YouTube.

**B. Estudio.** Escritorio, en claro y en oscuro. Se entra con la cuenta de Twitch; hoy solo la mía, pero algún día podría haber más canales, así que no lo dibujes como algo exclusivo de jotis_1:

1. Entrada: "Entrar con Twitch", y el aviso que ve una cuenta que no tiene acceso.
2. Overlays: chat, alertas, eventos, meta, estado, cámara y las cuatro escenas. Cada uno con vista previa, opciones, la URL lista para copiar y un recordatorio de activar en OBS "Actualizar al hacer visible la escena", y el token de los overlays con un botón para rotarlo. Botones para lanzar una alerta de prueba de cada tipo.
3. Recursos: los cinco paneles y el banner, con el enlace que va en el campo de enlace de Twitch al lado de cada panel con acción, y un botón para exportar.
4. Conexión con Twitch: sin conectar, conectado (con las suscripciones de eventos activas) y con una suscripción revocada.

**C. Overlays**, sobre una captura neutra que haga de juego o de cámara:

1. Las cuatro escenas; las de empezando y vuelvo enseguida, con cuenta atrás.
2. Escena de juego: el juego a pantalla completa con `CamFrame` pequeño, `ChatBox` translúcido, una `StreamAlert` entrando, `StreamEvents`, `StreamGoal` y `StreamStatus`, sin tapar la zona útil del juego.
3. Escena de Just Chatting: la cámara como protagonista, el chat grande y el resto de piezas en segundo plano.

**D. Perfil de Twitch.** Los cinco paneles y el `ChannelBanner` con el lema y el horario.

**E. Icono de app.** "Sc" en tono `lime`, en sus variantes y como favicon.
