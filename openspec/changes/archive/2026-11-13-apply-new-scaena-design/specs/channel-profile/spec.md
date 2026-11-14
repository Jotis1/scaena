# Spec Delta

## MODIFIED Requirements

### Requirement: Contenido del canal en un solo sitio
El sistema SHALL leer el contenido del canal desde un único perfil versionado en el repositorio: nombre, usuario de Twitch, lema, descripción, la frase que explica la web, los pasos de "Cómo va un directo", la línea del pie de la web, horario, qué se emite, redes, normas, paneles, textos de las escenas y frases de alerta por defecto. Ninguna pantalla SHALL repetir ese contenido por su cuenta.

#### Scenario: Cambio de lema
- **WHEN** se cambia el lema en el perfil y se despliega
- **THEN** la portada, el banner y las escenas muestran el nuevo lema sin tocar nada más

#### Scenario: Cambio de un paso
- **WHEN** se cambia en el perfil el texto del paso "La partida"
- **THEN** la portada muestra el texto nuevo en ese paso sin tocar nada más

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
