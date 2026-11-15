## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Cambios del perfil validados
Los cambios del perfil guardados en el estudio SHALL cumplir las mismas reglas que el perfil del repositorio (formatos, longitudes y sin emojis), comprobadas al guardar. El usuario de Twitch y el handle de YouTube MUST NOT poder cambiarse desde el estudio. Si lo guardado deja de valer con un perfil del repositorio nuevo, el sistema SHALL ignorar los campos que no valgan y usar los del repositorio, sin romper la web.

#### Scenario: Lo guardado ya no vale
- **WHEN** hay unas normas guardadas y un despliegue baja el máximo de normas por debajo de las que hay guardadas
- **THEN** la web carga con las normas del repositorio y el estudio avisa de que las guardadas no valen
