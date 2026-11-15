# twitch-profile-assets Specification

## Purpose

Generar los paneles y el banner del perfil de Twitch con los componentes de Regula y el contenido del perfil del canal, listos para subir a Twitch como imagen.

## Requirements

### Requirement: Paneles del perfil
El sistema SHALL generar un panel por cada entrada de paneles del perfil del canal (por ejemplo, de qué va el canal, horario, normas y redes), de 320px de ancho.

#### Scenario: Panel de normas
- **WHEN** el perfil tiene un panel "Normas" con tres filas
- **THEN** se genera un panel con el título "Normas" y sus tres filas

### Requirement: Banner del perfil
El sistema SHALL generar el banner del perfil a 1200×480 con el nombre, el lema y el horario del perfil del canal.

#### Scenario: Banner con horario
- **WHEN** el horario es "de 17:00 a 20:00" sin días fijos
- **THEN** el banner muestra a la derecha, dentro de la zona segura, "Suele ser 17-20 h" y "Días: Sin fijar", cada fila en una línea

### Requirement: Vista previa
La página privada de recursos SHALL mostrar todos los paneles y el banner tal como se verán en Twitch, con el perfil del canal tal como está guardado o como se está editando.

#### Scenario: Revisar antes de exportar
- **WHEN** se abre la página de recursos
- **THEN** se ven todos los paneles uno debajo de otro y el banner a tamaño real

#### Scenario: Vista previa mientras se edita
- **WHEN** en el editor del perfil se cambia la segunda norma sin guardar
- **THEN** el panel "Normas" de la vista previa enseña la norma nueva

### Requirement: Exportación a PNG
Desde la página de recursos, el sistema SHALL exportar a PNG cada panel por separado, el banner, o todo junto en un .zip. Los paneles SHALL salir a 640px de ancho (2x) y el banner a 1200×480, con las fuentes de Regula ya cargadas y con un nombre de archivo que identifica la pieza, que la página enseña junto a cada una.

#### Scenario: Exportar un panel
- **WHEN** se pulsa "Descargar" en el panel "Normas"
- **THEN** se descarga `panel-normas.png`, de 640px de ancho, con el texto en Geist y Bricolage

#### Scenario: Exportar todo
- **WHEN** se pulsa "Descargar todo (.zip)" en la cabecera de la página
- **THEN** se descarga un archivo con un PNG por panel y `banner.png` de 1200×480

### Requirement: Enlaces fuera de la imagen
Para cada panel con acción, el sistema SHALL indicar junto a la vista previa el enlace que hay que poner en el campo de enlace del panel en Twitch, porque la imagen no es clicable.

#### Scenario: Panel con botón
- **WHEN** el panel "Vídeos" tiene la acción "Ver en YouTube"
- **THEN** la vista previa muestra al lado la URL de YouTube para copiarla en Twitch

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
