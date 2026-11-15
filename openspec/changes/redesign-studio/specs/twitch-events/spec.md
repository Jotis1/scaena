## MODIFIED Requirements

### Requirement: Aviso de eventos sin conectar
Mientras los eventos del canal no lleguen del todo (sin conectar, con alguna suscripción revocada o sin dar de alta), las páginas de overlays, guía de OBS y recursos del estudio SHALL mostrar, justo debajo de la navegación, un aviso que diga qué pasa y lleve a la página de conexión. El aviso MUST NOT aparecer si todas las suscripciones están activas o verificándose, ni si Twitch no responde al consultarlas.

#### Scenario: Eventos sin conectar
- **WHEN** el dueño del canal abre la página de overlays sin haber conectado los eventos
- **THEN** ve el aviso "Eventos sin conectar" con el botón "Conectar eventos", que lleva a la página de conexión

#### Scenario: Suscripción revocada
- **WHEN** Twitch ha revocado la suscripción de raids
- **THEN** la página de recursos muestra el mismo aviso de revocación que la de conexión, con el botón "Revisar la conexión"

#### Scenario: Todo conectado
- **WHEN** las ocho suscripciones están activas
- **THEN** no aparece ningún aviso

#### Scenario: Twitch no responde
- **WHEN** Twitch no contesta al consultar las suscripciones
- **THEN** la página carga sin aviso

#### Scenario: En la guía, debajo de la navegación
- **WHEN** se abre la guía de OBS sin haber conectado los eventos
- **THEN** el aviso aparece entre la barra de secciones y el título de la página

### Requirement: Disparo de prueba
La fuente «Alertas» de la página privada de overlays SHALL permitir lanzar un evento de prueba de cada tipo, con un botón al lado de su frase: follow, sub de nivel 1, renovación de 14 meses, 5 subs regaladas, raid de 1.284 y 500 bits. El evento de prueba llega a los overlays como uno real, con la frase guardada de su tipo, va marcado como prueba en el registro y no aparece en el chat. El evento de prueba MUST NOT sumar a ninguna meta.

#### Scenario: Probar una alerta
- **WHEN** en la fuente «Alertas» se pulsa «Raid de 1.284»
- **THEN** el overlay de alertas abierto en OBS muestra una alerta de raid de 1.284 espectadores con la frase de raid, y el estudio confirma «Prueba enviada a OBS: Raid de 1.284.»

#### Scenario: La prueba no mueve la meta
- **WHEN** la meta de subs está en 284 y se pulsa «5 subs regaladas» en la fuente «Alertas»
- **THEN** la alerta de prueba sale, pero la meta sigue en 284
