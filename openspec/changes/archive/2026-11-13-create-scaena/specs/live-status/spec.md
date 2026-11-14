# Spec Delta

## Purpose

Saber si el canal está en directo y con qué datos (título, categoría, espectadores, tiempo en emisión), para que la web pública y el overlay de estado lo muestren sin consultar Twitch en cada visita.

## ADDED Requirements

### Requirement: Estado del canal
El sistema SHALL exponer el estado del canal configurado: en directo u offline y, en directo, título, categoría, espectadores e inicio de la emisión.

#### Scenario: Canal en directo
- **WHEN** el canal está emitiendo
- **THEN** el estado es "en directo" con título, categoría, espectadores e inicio

#### Scenario: Canal sin emitir
- **WHEN** el canal no está emitiendo
- **THEN** el estado es "offline" y no incluye espectadores

### Requirement: Caché del estado
El sistema SHALL reutilizar el estado durante un máximo de 60 segundos y SHALL actualizarlo al momento cuando Twitch avise de que la emisión empieza o termina.

#### Scenario: Empieza el directo
- **WHEN** Twitch avisa de que el canal ha empezado a emitir
- **THEN** la siguiente consulta del estado ya dice "en directo", aunque la caché no haya caducado

### Requirement: Fallo de Twitch
Si Twitch no responde, el sistema SHALL devolver el último estado conocido marcado como no actualizado y, si no hay ninguno, "offline". Nunca SHALL romper la página que lo usa.

#### Scenario: Twitch caído
- **WHEN** la API de Twitch devuelve error y hay un estado de hace tres minutos
- **THEN** se devuelve ese estado marcado como no actualizado y la web carga con normalidad

### Requirement: Overlay de estado
El overlay de estado SHALL mostrar el estado con la pieza de Regula y SHALL actualizarse solo, sin recargar la fuente. Mostrar los espectadores SHALL ser opcional por parámetro y estar desactivado por defecto.

#### Scenario: Ocultar espectadores
- **WHEN** el overlay de estado se carga sin la opción de espectadores
- **THEN** muestra "En directo", el tiempo en emisión y la categoría, pero no la cifra de espectadores
