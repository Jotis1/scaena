## ADDED Requirements

### Requirement: Recursos del canal de la sesión
Recursos SHALL enseñar y editar el contenido del canal de la sesión: sus paneles, su banner y su perfil. Guardar o volver a los valores por defecto SHALL tocar solo ese canal. Para un canal añadido, «Volver a los valores por defecto» SHALL dejar el perfil que sale de su Twitch.

#### Scenario: Normas de sunara__
- **WHEN** sunara__ guarda tres normas en Recursos
- **THEN** su panel «Normas» las enseña y el de jotis_1 sigue con las suyas

#### Scenario: Volver a los valores por defecto en un canal añadido
- **WHEN** sunara__ pulsa «Volver a los valores por defecto»
- **THEN** su perfil vuelve al que sale de su Twitch, sin normas y con los paneles «De qué va» y «Horario»
