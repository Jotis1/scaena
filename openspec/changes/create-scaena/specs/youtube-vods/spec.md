# Spec Delta

## Purpose

Listar los directos resubidos al canal de YouTube para que la web del canal los muestre, sin depender de que la API de YouTube responda en cada visita.

## ADDED Requirements

### Requirement: Origen de los vídeos
El sistema SHALL tomar todos los vídeos subidos al canal de YouTube indicado en el perfil (directos resubidos y editados), del más reciente al más antiguo, con título, miniatura, fecha de publicación, duración y enlace.

#### Scenario: Vídeo nuevo en el canal
- **WHEN** se sube un vídeo al canal de YouTube
- **THEN** aparece el primero en el listado tras la siguiente actualización

### Requirement: Solo vídeos públicos
El sistema MUST excluir los vídeos privados, ocultos, eliminados y los estrenos que aún no se han emitido.

#### Scenario: Vídeo privado en la lista
- **WHEN** la lista contiene un vídeo privado
- **THEN** no aparece en el listado

### Requirement: Caché y cuota
El sistema SHALL reutilizar el listado durante al menos una hora y SHALL consultar YouTube como mucho una vez por hora, sea cual sea el número de visitas.

#### Scenario: Muchas visitas
- **WHEN** la web recibe mil visitas en una hora
- **THEN** YouTube se consulta como mucho una vez en esa hora

### Requirement: Fallo de YouTube
Si YouTube falla o se agota la cuota, el sistema SHALL servir el último listado conocido y, si no hay ninguno, un listado vacío; la web SHALL seguir cargando.

#### Scenario: Cuota agotada
- **WHEN** YouTube responde que se ha agotado la cuota
- **THEN** la web muestra el último listado guardado

### Requirement: Paginación
El sistema SHALL servir el listado en páginas de doce vídeos, con el filtro de tipo aplicado antes de paginar.

#### Scenario: Segunda página
- **WHEN** hay 30 vídeos y se pide la segunda página
- **THEN** se devuelven los vídeos del 13 al 24

### Requirement: Tipo y juego desde el título
El sistema SHALL leer el tipo y el juego de cada vídeo de su título. Un título que termina en " - <juego> #<número>" SHALL tratarse como "Directo resubido": el título visible es lo anterior al último " - ", y se guardan el juego y el número. Cualquier otro título SHALL tratarse como "Editado", sin juego y con el título tal cual.

#### Scenario: Directo resubido
- **WHEN** un vídeo se titula "La ciudad que nunca duerme - Cyberpunk 2077 #1"
- **THEN** su tipo es "Directo resubido", su juego "Cyberpunk 2077", su número 1 y su título "La ciudad que nunca duerme"

#### Scenario: Guion dentro del título
- **WHEN** un vídeo se titula "Antes - después - Elden Ring #12"
- **THEN** su título es "Antes - después", su juego "Elden Ring" y su número 12

#### Scenario: Editado
- **WHEN** un vídeo se titula "Cinco horas en Night City en diez minutos"
- **THEN** su tipo es "Editado", no tiene juego y su título no cambia

#### Scenario: Casi el formato
- **WHEN** un vídeo se titula "Cyberpunk 2077 #1" o "Algo - Cyberpunk 2077 #uno"
- **THEN** se trata como "Editado"
