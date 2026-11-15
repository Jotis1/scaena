## MODIFIED Requirements

### Requirement: Vista previa
La página privada de recursos SHALL mostrar todos los paneles y el banner tal como se verán en Twitch, con el perfil del canal tal como está guardado o como se está editando.

#### Scenario: Revisar antes de exportar
- **WHEN** se abre la página de recursos
- **THEN** se ven todos los paneles uno debajo de otro y el banner a tamaño real

#### Scenario: Vista previa mientras se edita
- **WHEN** en el editor del perfil se cambia la segunda norma sin guardar
- **THEN** el panel "Normas" de la vista previa enseña la norma nueva

## ADDED Requirements

### Requirement: Editar el contenido de los recursos
La página de recursos SHALL dejar editar el contenido del canal del que salen los paneles y el banner: lema, descripción, horario (franja, días y zona), redes (con su usuario y su enlace opcional), normas, paneles (título, icono, textos y acción) y la línea del banner. Guardar SHALL validar con las mismas reglas que el perfil del repositorio y SHALL decir qué campo falla sin guardar nada si alguno no vale.

#### Scenario: Cambiar una norma
- **WHEN** se cambia la tercera norma y se guarda
- **THEN** el panel "Normas" la enseña, y el PNG que se descarga después también

#### Scenario: Emoji en una norma
- **WHEN** se intenta guardar una norma con un emoji
- **THEN** no se guarda nada y el editor señala esa norma con el motivo

#### Scenario: Volver al perfil por defecto
- **WHEN** se pulsa «Volver a los valores por defecto» y se confirma
- **THEN** se borra lo guardado y los paneles y el banner vuelven a salir del perfil del repositorio
