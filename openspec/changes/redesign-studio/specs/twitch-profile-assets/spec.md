## MODIFIED Requirements

### Requirement: Exportación a PNG
Desde la página de recursos, el sistema SHALL exportar a PNG cada panel por separado, el banner, o todo junto en un .zip. Los paneles SHALL salir a 640px de ancho (2x) y el banner a 1200×480, con las fuentes de Regula ya cargadas y con un nombre de archivo que identifica la pieza, que la página enseña junto a cada una.

#### Scenario: Exportar un panel
- **WHEN** se pulsa "Descargar" en el panel "Normas"
- **THEN** se descarga `panel-normas.png`, de 640px de ancho, con el texto en Geist y Bricolage

#### Scenario: Exportar todo
- **WHEN** se pulsa "Descargar todo (.zip)" en la cabecera de la página
- **THEN** se descarga un archivo con un PNG por panel y `banner.png` de 1200×480
