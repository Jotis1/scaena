## MODIFIED Requirements

### Requirement: Contenido del canal en un solo sitio
El sistema SHALL leer el contenido de cada canal de un único perfil: unos valores por defecto con los cambios guardados en el estudio encima. Para el canal principal, los valores por defecto son el perfil versionado en el repositorio; para un canal añadido desde «Cuentas», los que salen de su Twitch. Incluye nombre, usuario de Twitch, lema, descripción, la frase de la web, los pasos de "Cómo va un directo", el pie, horario, qué se emite, redes, normas, paneles, textos de escenas y frases de alerta por defecto. Ninguna pantalla SHALL repetir ese contenido por su cuenta, ni mezclar el de dos canales.

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

#### Scenario: El horario de otro canal no toca la web
- **WHEN** sunara__ guarda en Recursos el horario de 20:00 a 23:00
- **THEN** sus paneles y sus escenas lo enseñan, y la portada de la web sigue con el horario de jotis_1

## ADDED Requirements

### Requirement: Perfil de un canal añadido
Un canal añadido desde «Cuentas» SHALL empezar con el nombre y la descripción de su Twitch, y Twitch como única red. Normas, horario y qué se emite SHALL empezar vacíos; los paneles SHALL salir de sus datos, sin enseñar los que no tienen nada. Escenas, alertas y cámara SHALL llevar textos genéricos con su nombre. YouTube SHALL ser opcional en estos perfiles, y el perfil del repositorio SHALL seguir exigiéndolo todo.

#### Scenario: Primera entrada de sunara__
- **WHEN** sunara__ entra por primera vez y abre Recursos
- **THEN** el lema y la descripción son los de su Twitch, las redes tienen solo Twitch con su enlace, las normas y el horario están vacíos, y salen los paneles «De qué va» y «Horario»

#### Scenario: El panel de normas aparece al escribirlas
- **WHEN** sunara__ guarda su primera norma en Recursos
- **THEN** aparece su panel «Normas» con esa norma

#### Scenario: Su Twitch sin descripción
- **WHEN** el canal añadido no tiene descripción en Twitch
- **THEN** la descripción empieza con una frase genérica con su nombre, que puede cambiar en Recursos

#### Scenario: El principal sigue exigiéndolo todo
- **WHEN** se construye con un `content/channel.yaml` sin YouTube
- **THEN** el build falla diciendo que falta YouTube en el perfil del repositorio
