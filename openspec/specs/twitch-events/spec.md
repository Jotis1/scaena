# twitch-events Specification

## Purpose

Recibir de Twitch los eventos del canal (follows, suscripciones, renovaciones, regalos, raids y bits), verificarlos y entregarlos en tiempo real y sin duplicados a los overlays de alerta, eventos recientes y meta.

## Requirements

### Requirement: Conexión del canal
La entrada al estudio con Twitch SHALL pedir los permisos mínimos para leer follows, suscripciones, bits y metas del creador. Desde la página de conexión del estudio, el dueño del canal SHALL poder dar de alta y borrar las suscripciones de eventos del canal. Si al token actual de la sesión le falta un permiso, según Twitch, la página de conexión SHALL decir cuál falta y ofrecer volver a entrar con Twitch; si Twitch no contesta, no SHALL avisar.

#### Scenario: Primera conexión
- **WHEN** el dueño del canal ha entrado con Twitch y pulsa "Conectar eventos"
- **THEN** el sistema da de alta follows, suscripciones, renovaciones, regalos, raids entrantes, bits y el inicio, el progreso y el final de las metas, y la página de conexión los muestra como activos

#### Scenario: Reconexión sin duplicar
- **WHEN** se repite la conexión con las suscripciones ya activas
- **THEN** el sistema no crea suscripciones repetidas

#### Scenario: Falta el permiso de metas
- **WHEN** el dueño del canal entró antes de pedirse el permiso de metas y abre la página de conexión
- **THEN** la página dice que falta el permiso para leer las metas y ofrece «Volver a entrar con Twitch»

#### Scenario: Tras volver a entrar
- **WHEN** al dueño del canal le faltaba el permiso de metas, vuelve a entrar con Twitch dándolo y abre la página de conexión
- **THEN** la página ya no dice que falte ningún permiso

#### Scenario: Twitch no contesta
- **WHEN** Twitch no contesta al preguntar los permisos del token y se abre la página de conexión
- **THEN** la página no avisa de ningún permiso

### Requirement: Aviso de eventos sin conectar
Mientras los eventos del canal no lleguen del todo (sin conectar, con alguna suscripción revocada o sin dar de alta), las páginas de overlays, guía de uso y recursos del estudio SHALL mostrar, encima del contenido de la página, un aviso que diga qué pasa y lleve a la página de conexión. El aviso MUST NOT aparecer si todas las suscripciones están activas o verificándose, ni si Twitch no responde al consultarlas.

#### Scenario: Eventos sin conectar
- **WHEN** el dueño del canal abre la página de overlays sin haber conectado los eventos
- **THEN** ve el aviso "Eventos sin conectar" con el botón "Conectar eventos", que lleva a la página de conexión

#### Scenario: Suscripción revocada
- **WHEN** Twitch ha revocado la suscripción de raids
- **THEN** la página de recursos muestra el mismo aviso de revocación que la de conexión, con el botón "Revisar la conexión"

#### Scenario: Todo conectado
- **WHEN** las once suscripciones están activas
- **THEN** no aparece ningún aviso

#### Scenario: Twitch no responde
- **WHEN** Twitch no contesta al consultar las suscripciones
- **THEN** la página carga sin aviso

#### Scenario: En la guía, debajo de la navegación
- **WHEN** se abre la guía de uso sin haber conectado los eventos
- **THEN** el aviso aparece entre la cabecera de la web y el título de la página, al lado de la barra lateral

### Requirement: Verificación de la firma
El sistema MUST aceptar una notificación de Twitch solo si su firma es válida con el secreto configurado y su marca de tiempo no tiene más de diez minutos; en otro caso MUST rechazarla sin procesarla.

#### Scenario: Firma falsa
- **WHEN** llega una petición con una firma que no corresponde al secreto
- **THEN** se responde con error 403 y no llega nada a los overlays

#### Scenario: Notificación antigua
- **WHEN** llega una notificación con firma válida y marca de tiempo de hace quince minutos
- **THEN** se rechaza

### Requirement: Validación de la suscripción
El sistema SHALL responder al reto de verificación de Twitch devolviendo el valor del reto, y SHALL registrar cuándo Twitch revoca una suscripción.

#### Scenario: Reto de verificación
- **WHEN** Twitch envía el reto al dar de alta una suscripción
- **THEN** el sistema responde con el valor del reto en texto plano y estado 200

#### Scenario: Revocación
- **WHEN** Twitch revoca una suscripción porque el dueño retiró la autorización
- **THEN** la página de conexión la muestra como inactiva

### Requirement: Sin duplicados
El sistema MUST entregar cada evento a los overlays una sola vez aunque Twitch repita la notificación.

#### Scenario: Reintento de Twitch
- **WHEN** Twitch envía dos veces la misma notificación con el mismo identificador
- **THEN** la alerta se muestra una sola vez

### Requirement: Traducción a eventos de Regula
El sistema SHALL convertir cada notificación al evento de Regula correspondiente (follow, sub, resub, gift, raid, bits) con usuario, cifra, meses y nivel cuando existan. El mensaje del espectador SHALL pasar como texto plano.

#### Scenario: Raid entrante
- **WHEN** otro canal hace un raid con 1.284 espectadores
- **THEN** el evento es de tipo raid, con el nombre del canal y la cifra 1.284

#### Scenario: Renovación con mensaje
- **WHEN** un espectador renueva por 14 meses con un mensaje
- **THEN** el evento es resub con 14 meses y el mensaje tal cual lo escribió

### Requirement: Cola de alertas
El overlay de alertas SHALL mostrar las alertas de una en una, en orden de llegada, cada una durante un tiempo configurable con siete segundos por defecto.

#### Scenario: Dos eventos seguidos
- **WHEN** llegan un follow y una sub con un segundo de diferencia
- **THEN** se ve la alerta del follow, sale, y después entra la de la sub

### Requirement: Eventos recientes y metas
El overlay de eventos SHALL mostrar los últimos eventos del más reciente al más antiguo. Cada meta de Scaena SHALL avanzar con los eventos de su tipo (suscripciones, seguidores o bits), salga o no. Con metas guardadas, la cuenta SHALL llevarla el servidor: cada evento que cuenta SHALL sumar una sola vez a cada meta de su tipo aunque haya varios overlays abiertos o ninguno, y un overlay al abrirse SHALL verla al día.

#### Scenario: Meta de subs
- **WHEN** la meta cuenta suscripciones, empieza en 284 y llega una sub regalada de 5
- **THEN** la meta muestra 289

#### Scenario: Eventos con OBS cerrado
- **WHEN** la meta guardada de seguidores va por 40, OBS está cerrado y llegan 3 follows durante una hora
- **THEN** al abrir OBS la meta muestra 43

#### Scenario: Dos overlays con la misma meta
- **WHEN** la pieza de meta y la escena de juego están abiertas a la vez y llega una sub
- **THEN** las dos suman 1, y la cuenta guardada sube 1

#### Scenario: La meta que no sale también cuenta
- **WHEN** sale la meta de subs, la de seguidores va por 40 y llegan 2 follows
- **THEN** al elegir la de seguidores muestra 42

#### Scenario: Dos metas del mismo tipo
- **WHEN** hay dos metas de Scaena de seguidores, una por 10 y otra por 500, y llega un follow
- **THEN** pasan a 11 y a 501

### Requirement: Disparo de prueba
La fuente «Alertas» de la página privada de overlays SHALL permitir lanzar un evento de prueba de cada tipo, con un botón al lado de su frase: follow, sub de nivel 1, renovación de 14 meses, 5 subs regaladas, raid de 1.284 y 500 bits. El evento de prueba llega a los overlays como uno real, con la frase guardada de su tipo, va marcado como prueba en el registro y no aparece en el chat. El evento de prueba MUST NOT sumar a ninguna meta.

#### Scenario: Probar una alerta
- **WHEN** en la fuente «Alertas» se pulsa «Raid de 1.284»
- **THEN** el overlay de alertas abierto en OBS muestra una alerta de raid de 1.284 espectadores con la frase de raid, y el estudio confirma «Prueba enviada a OBS: Raid de 1.284.»

#### Scenario: La prueba no mueve la meta
- **WHEN** la meta de subs está en 284 y se pulsa «5 subs regaladas» en la fuente «Alertas»
- **THEN** la alerta de prueba sale, pero la meta sigue en 284

### Requirement: Seguimiento de la meta de Twitch
El sistema SHALL guardar todas las metas del creador activas del canal, cada una por su id: al conectar los eventos y al abrir el estudio SHALL pedirlas a Twitch y sustituir las guardadas, y con los avisos de inicio y progreso SHALL actualizar solo la meta del aviso. Un aviso de final SHALL borrar solo esa meta. Cada cambio SHALL llegar a los overlays abiertos con lo que tienen que pintar. Si Twitch no responde al pedirlas, SHALL conservar las que tenía.

#### Scenario: Empieza una meta en Twitch
- **WHEN** Twitch avisa de que empieza una meta de suscripciones de 0 a 50
- **THEN** queda guardada una meta de Twitch de suscripciones, 0 de 50, que el estudio ofrece en «Qué meta sale»

#### Scenario: Progreso repetido
- **WHEN** llega dos veces el mismo aviso de progreso, con 12 de 50
- **THEN** la meta queda en 12 de 50, no en 24

#### Scenario: Meta ya activa al conectar
- **WHEN** el canal ya tenía en Twitch una meta de seguidores por 950 de 1.000 y otra de bits por 200 de 500, y se pulsa "Conectar eventos"
- **THEN** quedan guardadas las dos, con sus cifras, sin esperar al siguiente aviso

#### Scenario: Dos metas a la vez
- **WHEN** hay guardadas una meta de Twitch de seguidores por 950 y otra de subs por 10, y llega un aviso de progreso de la de subs con 11
- **THEN** la de subs pasa a 11 y la de seguidores sigue en 950

#### Scenario: Acaba una de dos
- **WHEN** hay guardadas una meta de Twitch de seguidores y otra de subs, y Twitch avisa de que la de subs ha terminado
- **THEN** sigue guardada la de seguidores

#### Scenario: Tipos de meta de Twitch
- **WHEN** Twitch avisa de una meta de tipo `new_cheerer`
- **THEN** la meta se muestra con su descripción y la unidad «personas»

### Requirement: Cuenta conectada con su foto
En Conexión, la tarjeta «Cuenta conectada» SHALL enseñar la foto de perfil de la cuenta de Twitch de la sesión, la misma que la cabecera. Solo si Twitch no da foto SHALL enseñar la inicial del nombre.

#### Scenario: Con foto
- **WHEN** la cuenta de Twitch de la sesión tiene foto de perfil y se abre Conexión
- **THEN** la tarjeta «Cuenta conectada» enseña esa foto y no la inicial

#### Scenario: Sin foto
- **WHEN** la cuenta de Twitch de la sesión no tiene foto y se abre Conexión
- **THEN** la tarjeta enseña la inicial del nombre
