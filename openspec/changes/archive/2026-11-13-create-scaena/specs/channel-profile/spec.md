# Spec Delta

## Purpose

Fuente única del contenido del canal (identidad, descripción, horario, redes, normas, paneles, ajustes de partida y textos de escenas), de la que beben la web pública, las escenas de OBS, los paneles y el banner de Twitch.

## ADDED Requirements

### Requirement: Contenido del canal en un solo sitio
El sistema SHALL leer el contenido del canal desde un único perfil versionado en el repositorio: nombre, usuario de Twitch, lema, descripción, ajustes de partida, horario, qué se emite, redes, normas, paneles, textos de las escenas y frases de alerta por defecto. Ninguna pantalla SHALL repetir ese contenido por su cuenta.

#### Scenario: Cambio de lema
- **WHEN** se cambia el lema en el perfil y se despliega
- **THEN** la portada, el banner y las escenas muestran el nuevo lema sin tocar nada más

### Requirement: Validación del perfil al construir
El sistema MUST validar el perfil al construir y MUST fallar la construcción con un mensaje que nombre el campo cuando falte un campo obligatorio o un valor no cumpla su formato.

#### Scenario: Falta el usuario de Twitch
- **WHEN** el perfil no tiene usuario de Twitch
- **THEN** la construcción falla y el mensaje dice qué campo falta

#### Scenario: Hora mal escrita
- **WHEN** la franja habitual empieza a las "25:00"
- **THEN** la construcción falla y el mensaje señala la franja

### Requirement: Límites de longitud de la guía
El sistema MUST fallar al construir cuando un titular de escena supere los 24 caracteres que admite la guía de Regula. El horario del banner se genera a partir de la franja y los días, siempre en dos filas, así que nunca pasa de las cuatro que admite el banner.

#### Scenario: Titular de escena demasiado largo
- **WHEN** el titular de la escena "empezando" tiene 30 caracteres
- **THEN** la construcción falla indicando el límite de 24

### Requirement: Sin emojis en los textos
El sistema MUST fallar al construir cuando un texto del perfil que se muestra en la interfaz (descripciones, paneles, escenas, normas, ajustes de partida) contenga emojis, porque la guía de Regula no los admite.

#### Scenario: Emoji en un panel
- **WHEN** el texto del panel "Normas" lleva un emoji
- **THEN** la construcción falla y el mensaje señala ese panel

### Requirement: Horario habitual
El horario SHALL guardar una franja habitual (hora de inicio y de fin) y, opcionalmente, los días. Sin días, el sistema SHALL mostrar "Sin fijar". En la web y en el panel de horario, la franja SHALL mostrarse como "Normalmente 17:00 – 20:00", con la etiqueta "Hora peninsular" en la web. En el banner, donde el espacio es menor, SHALL mostrarse en corto como "Suele ser 17-20 h". Así se lee como costumbre y no como cita.

#### Scenario: Franja sin días fijos
- **WHEN** el horario es de 17:00 a 20:00 sin días
- **THEN** la web y el panel de horario muestran "Normalmente 17:00 – 20:00" y "Días: Sin fijar"

#### Scenario: Franja en el banner
- **WHEN** se genera el banner con ese horario
- **THEN** muestra "Suele ser 17-20 h" y "Días: Sin fijar", cada fila en una sola línea

### Requirement: Enlaces opcionales
Las redes SHALL poder dejarse sin enlace en el perfil. Una red sin enlace MUST NOT mostrarse como enlace roto ni con un texto de relleno.

#### Scenario: Discord sin invitación
- **WHEN** el perfil tiene Discord sin enlace de invitación
- **THEN** Discord no aparece en "Dónde verlo", en el pie ni en el panel de redes
