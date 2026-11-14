# Spec Delta

## Purpose

Leer el chat del canal de Twitch en directo y mostrarlo en el overlay de chat con la gramática de Regula, respetando la moderación del canal.

## ADDED Requirements

### Requirement: Lectura del chat del canal
El overlay de chat SHALL mostrar en tiempo real los mensajes del chat del canal configurado en el perfil, del más antiguo al más reciente, con un máximo de doce visibles.

#### Scenario: Llega un mensaje
- **WHEN** un espectador escribe en el chat del canal
- **THEN** el mensaje aparece en el overlay en menos de dos segundos, como último de la lista

#### Scenario: Más de doce mensajes
- **WHEN** llega el decimotercer mensaje
- **THEN** el más antiguo deja de verse

### Requirement: Texto siempre plano
El sistema MUST pintar el texto de cada mensaje como texto plano y MUST NOT interpretar HTML, marcado ni enlaces.

#### Scenario: Mensaje con HTML
- **WHEN** un espectador escribe `<img src=x onerror=alert(1)>`
- **THEN** el overlay muestra esos caracteres literalmente y no se ejecuta nada

### Requirement: Insignias y tono por rol
Cada mensaje SHALL mostrar como mucho tres insignias de Regula, en este orden de prioridad: emisor, moderador, VIP, suscriptor y bits. El nombre SHALL usar un tono de Regula estable por usuario, no el color elegido en Twitch.

#### Scenario: Moderador suscrito
- **WHEN** escribe un moderador que también es suscriptor
- **THEN** el mensaje lleva las insignias de moderador y suscriptor, en ese orden

#### Scenario: Mismo usuario, mismo tono
- **WHEN** un mismo usuario escribe dos mensajes
- **THEN** su nombre sale en el mismo tono las dos veces

### Requirement: Respeto de la moderación
El overlay MUST quitar un mensaje cuando se borra en Twitch, MUST quitar todos los mensajes de un usuario cuando se le banea o expulsa temporalmente y MUST vaciarse cuando se limpia el chat.

#### Scenario: Mensaje borrado
- **WHEN** un moderador borra un mensaje que está en pantalla
- **THEN** el mensaje desaparece del overlay

#### Scenario: Usuario baneado
- **WHEN** se banea a un usuario con tres mensajes en pantalla
- **THEN** desaparecen los tres

### Requirement: Usuarios ocultos
El sistema SHALL ocultar los mensajes de los usuarios de una lista del perfil (por ejemplo, bots) y los mensajes que empiezan por `!`.

#### Scenario: Comando de bot
- **WHEN** alguien escribe `!horario` y el bot del canal responde
- **THEN** ninguno de los dos mensajes aparece en el overlay

### Requirement: Reconexión del chat
El overlay de chat SHALL reconectarse solo si se pierde la conexión con el chat de Twitch, conservando los mensajes que ya estaban en pantalla.

#### Scenario: Twitch corta la conexión
- **WHEN** Twitch cierra la conexión del chat
- **THEN** el overlay vuelve a conectar en menos de 30 segundos y los mensajes previos siguen visibles
