Gracias, la historia funciona: no la cambies. Estas son las correcciones del diseño de **Scaena**.

## Portada

1. **Una broma por pantalla.** Quédate solo con la mía ("Si tienes prisa, te entiendo, pero aquí no.") y deja el resto en un tono neutro, sin ironía:
   - "Hay horario, pero no es un contrato.";
   - "Así se juega aquí. No se pueden cambiar.";
   - "El que me dejé atrás. Siempre.";
   - "para quien no tenga tres horas";
   - "Todo lo demás, después.".
2. **"Ajustes de partida" sin interruptores.** Mantén la idea, pero como filas fijas que no parezcan controles: un icono de check y el texto. Nada que se pueda enfocar o pulsar.
3. **Tipo de vídeo en neutro.** "Directo resubido" y "Editado" no van en color de marca en las tarjetas; van en gris. Lo mismo en la página de vídeos.
4. **Discord** sigue como `[invitación]`; te paso el enlace más adelante. "Hora peninsular" se queda.
5. **Sin "En la estantería".** No la añadas: queda para una versión posterior.

## Vídeos

6. **Menos marca.** La tarjeta del vídeo que se está reproduciendo se marca sin borde de marca y sin duplicar "Reproduciendo" (en la insignia y en la etiqueta). Con una de las dos basta, en neutro.
7. **Tipo y juego salen del título del vídeo de YouTube.** Los directos resubidos se titulan "[título] - [juego] #[número]"; los editados, con cualquier título. Por ejemplo:
   - "La ciudad que nunca duerme - Cyberpunk 2077 #1" → tipo "Directo resubido", juego "Cyberpunk 2077", parte 1, título "La ciudad que nunca duerme";
   - "Cinco horas en Night City en diez minutos" → tipo "Editado", sin juego.
   
   En la tarjeta del directo, el título se muestra sin el juego ni el número, que van aparte (por ejemplo "Cyberpunk 2077 · #1"). El editado lleva solo su título y su tipo.

## Escenas montadas

8. **La escena de juego y la de Just Chatting pasan a ser escenas listas para usar**, cada una con su URL, igual que las otras cuatro:
   - `scaena.jotis.me/overlay/jotis1/scene/game`;
   - `scaena.jotis.me/overlay/jotis1/scene/chatting`.
   
   Añádelas al estudio con su vista previa y sus opciones. Lo que va debajo (juego y cámara) lo pone OBS.
9. **Just Chatting.** No bajes la opacidad de la meta y los eventos: así pierden contraste. Déjalos en segundo plano por tamaño y posición. Revisa también que la alerta no tape los mensajes del chat.

## Estudio

10. **Quita el selector de canal** de la barra lateral. El canal sale de la cuenta con la que se entra.
11. **"Enseñar espectadores"** viene desactivado por defecto en el overlay de estado.
12. **Rotar el token** pide confirmación antes: dibuja ese `Modal`.
13. **Conexión sin conectar.** El botón dice "Conectar eventos": la cuenta ya ha entrado con Twitch, aquí solo se dan de alta las suscripciones.
14. **Rutas del estudio:**
    - entrada en `scaena.jotis.me/studio/login`;
    - páginas en `/studio/overlays`, `/studio/assets` y `/studio/connection`.
    
    Corrige los títulos de las mesas que pongan `/studio` a secas.

## Icono

15. Añade el icono "Sc" en `lime` al sistema de diseño Jotis.me, para que se use desde ahí.
