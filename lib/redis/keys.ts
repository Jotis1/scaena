// El único sitio que construye claves de Redis (design.md, decisión 14). Todo lo de un canal va bajo
// `channel:<id de Twitch>:…`; lo global (token de app, duplicados de EventSub) va fuera de ese prefijo.

/** Lo que se guarda por canal. Cerrado a propósito: una clave nueva se añade aquí y en ningún otro sitio. */
export type ChannelKeyPart =
	| "events"
	| "status"
	| "status:last"
	| "youtube"
	| "youtube:uploads"
	| "youtube:lock"
	| "eventsub"
	| "token"
	| "settings";

/** Los ids de usuario de Twitch son solo cifras. Así ningún id puede colarse en la clave de otro canal. */
function validId(id: string): string {
	if (!/^\d+$/.test(id))
		throw new Error(`Id de canal no válido: «${id}». Tiene que ser el id numérico de Twitch.`);
	return id;
}

export const keys = {
	channel: (id: string, part: ChannelKeyPart) => `channel:${validId(id)}:${part}`,
	/** Token de app de Twitch (client credentials), común a todos los canales. */
	appToken: () => "app:twitch:token",
	/** Marca de un mensaje de EventSub ya procesado, para descartar los reintentos de Twitch. */
	eventsubSeen: (messageId: string) => `eventsub:seen:${messageId}`,
	/** Id de Twitch a partir del login, para no preguntarlo en cada petición. */
	idFromLogin: (login: string) => `app:twitch:login:${login.toLowerCase()}`,
};
