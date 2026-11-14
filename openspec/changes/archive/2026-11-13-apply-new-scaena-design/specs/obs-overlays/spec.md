# Spec Delta

## MODIFIED Requirements

### Requirement: Página de URLs para copiar
El sistema SHALL ofrecer una página privada que liste cada overlay con su vista previa, sus opciones y la URL lista para pegar en OBS. Los overlays SHALL repartirse en dos pestañas, "Piezas" (chat, alertas, eventos, meta, estado y cámara) y "Escenas" (juego, Just Chatting, empezando, vuelvo enseguida, final y offline), cada una con su número. Cada URL SHALL llevar dentro de su campo un botón "Copiar". La indicación de cómo añadirlas en OBS SHALL ir una sola vez, en la cabecera de la página.

#### Scenario: Copiar URL configurada
- **WHEN** se elige "translúcido" para el chat en la página de URLs
- **THEN** la URL mostrada incluye esa opción y la vista previa la refleja

#### Scenario: Cambiar a escenas
- **WHEN** se pulsa la pestaña "Escenas"
- **THEN** se ven las seis escenas con su vista previa y su URL, y ninguna pieza suelta

#### Scenario: Copiar una URL
- **WHEN** se pulsa "Copiar" en la URL de la escena de juego
- **THEN** la URL queda en el portapapeles y el botón confirma que se ha copiado
