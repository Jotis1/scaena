# channel-profile Specification

## Purpose

Fuente única del contenido del canal (identidad, descripción, horario, redes, normas, paneles, ajustes de partida y textos de escenas), de la que beben la web pública, las escenas de OBS, los paneles y el banner de Twitch.

## Requirements

### Requirement: Contenido del canal en un solo sitio
El sistema SHALL leer el contenido del canal de un único perfil: el versionado en el repositorio, como valores por defecto, con los cambios guardados en el estudio encima. Incluye nombre, usuario de Twitch, lema, descripción, la frase de la web, los pasos de "Cómo va un directo", el pie, horario, qué se emite, redes, normas, paneles, textos de escenas y frases de alerta por defecto. Ninguna pantalla SHALL repetir ese contenido por su cuenta.

#### Scenario: Cambio de lema
- **WHEN** se cambia el lema en el perfil y se despliega
- **THEN** la portada, el banner y las escenas muestran el nuevo lema sin tocar nada más

#### Scenario: Cambio de un paso
- **WHEN** se cambia en el perfil el texto del paso "La partida"
- **THEN** la portada muestra el texto nuevo en ese paso sin tocar nada más

#### Scenario: Horario cambiado en el estudio
- **WHEN** en Recursos se guarda el horario de 18:00 a 21:00
- **THEN** sin desplegar, la portada dice "Suele haber directo de 18:00 a 21:00.", el panel de horario y el banner lo enseñan, y el pie de las escenas de pantalla completa también

#### Scenario: Sin cambios guardados
- **WHEN** no hay nada guardado en el estudio
- **THEN** todo sale del perfil del repositorio, como hasta ahora

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
El sistema MUST fallar al construir cuando un texto del perfil que se muestra en la interfaz (descripciones, la frase de la web, los pasos de la portada, el pie, paneles, escenas y normas) contenga emojis, porque la guía de Regula no los admite.

#### Scenario: Emoji en un panel
- **WHEN** el texto del panel "Normas" lleva un emoji
- **THEN** la construcción falla y el mensaje señala ese panel

#### Scenario: Emoji en un paso de la portada
- **WHEN** el texto del paso "Después" lleva un emoji
- **THEN** la construcción falla y el mensaje señala ese paso

### Requirement: Horario habitual
El horario SHALL guardar una franja habitual (hora de inicio y de fin) y, opcionalmente, los días. Sin días, el sistema SHALL mostrar "Sin fijar". En la portada, junto al estado del directo, la franja SHALL leerse como "Suele haber directo de 17:00 a 20:00.". En el panel de horario SHALL mostrarse como "Normalmente 17:00 – 20:00". En el banner, donde el espacio es menor, SHALL mostrarse en corto como "Suele ser 17-20 h". Así se lee como costumbre y no como cita.

#### Scenario: Franja sin días fijos
- **WHEN** el horario es de 17:00 a 20:00 sin días
- **THEN** la portada muestra "Suele haber directo de 17:00 a 20:00." y el panel de horario muestra "Normalmente 17:00 – 20:00" y "Días: Sin fijar"

#### Scenario: Franja en el banner
- **WHEN** se genera el banner con ese horario
- **THEN** muestra "Suele ser 17-20 h" y "Días: Sin fijar", cada fila en una sola línea

### Requirement: Enlaces opcionales
Las redes SHALL poder dejarse sin enlace en el perfil. Una red sin enlace MUST NOT mostrarse como enlace roto ni con un texto de relleno.

#### Scenario: Discord sin invitación
- **WHEN** el perfil tiene Discord sin enlace de invitación
- **THEN** Discord no aparece en el pie de la web, en el paso "Después" de la portada ni en el panel de redes

### Requirement: Cambios del perfil validados
Los cambios del perfil guardados en el estudio SHALL cumplir las mismas reglas que el perfil del repositorio (formatos, longitudes y sin emojis), comprobadas al guardar. El usuario de Twitch y el handle de YouTube MUST NOT poder cambiarse desde el estudio. Si lo guardado deja de valer con un perfil del repositorio nuevo, el sistema SHALL ignorar los campos que no valgan y usar los del repositorio, sin romper la web.

#### Scenario: Lo guardado ya no vale
- **WHEN** hay unas normas guardadas y un despliegue baja el máximo de normas por debajo de las que hay guardadas
- **THEN** la web carga con las normas del repositorio y el estudio avisa de que las guardadas no valen
