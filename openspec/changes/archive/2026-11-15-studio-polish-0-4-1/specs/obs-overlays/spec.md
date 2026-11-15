## ADDED Requirements

### Requirement: Estado al guardar qué meta sale
Al cambiar «Qué meta sale», las metas que rotan, «Al cumplirse» o el intervalo, el estudio SHALL enseñar el cambio al momento, sin esperar al servidor. Mientras se guarda, SHALL enseñar junto al selector un indicador de carga con el texto «Guardando…»; al acabar, «Guardado» o el error. Si no se guarda, SHALL volver a lo que había.

#### Scenario: Elegir otra meta
- **WHEN** en «Qué meta sale» se elige la meta de seguidores
- **THEN** el selector la enseña al momento, sale «Guardando…» con su indicador de carga y, al guardarse, «Guardado»

#### Scenario: Falla al guardar
- **WHEN** se elige la meta de seguidores y el servidor no la guarda
- **THEN** el selector vuelve a la meta que había y el estudio dice por qué no se ha guardado
