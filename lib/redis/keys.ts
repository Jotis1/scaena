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
	| "settings"
	/** Antigua (0.3.0): la cuenta de la única meta guardada. Solo se lee para migrarla (`readGoals`). */
	| "goal"
	/** Antigua (0.3.0): la única meta de Twitch guardada. Solo se borra al migrar. */
	| "twitch-goal"
	/** Hash `ref de meta → ms`: cuándo llegó cada meta a su objetivo (specs/obs-overlays, «Meta cumplida en la rotación»). */
	| "goal-done"
	/** Hash `id de meta de Twitch → JSON`: las metas del creador activas (specs/twitch-events, «Seguimiento de la meta de Twitch»). */
	| "twitch-goals";

/** Ids de las metas de Scaena: 8 letras minúsculas o cifras, para que no puedan colarse en otra clave. */
export const GOAL_ID = /^[a-z0-9]{8}$/;

/** Los ids de usuario de Twitch son solo cifras. Así ningún id puede colarse en la clave de otro canal. */
function validId(id: string): string {
	if (!/^\d+$/.test(id))
		throw new Error(`Id de canal no válido: «${id}». Tiene que ser el id numérico de Twitch.`);
	return id;
}

export const keys = {
	channel: (id: string, part: ChannelKeyPart) => `channel:${validId(id)}:${part}`,
	/** Cuenta de una meta de Scaena (un entero; specs/twitch-events, «Eventos recientes y metas»). */
	goalCount: (id: string, goalId: string) => {
		if (!GOAL_ID.test(goalId)) throw new Error(`Id de meta no válido: «${goalId}».`);
		return `channel:${validId(id)}:goal:${goalId}`;
	},
	/** Token de app de Twitch (client credentials), común a todos los canales. */
	appToken: () => "app:twitch:token",
	/** Marca de un mensaje de EventSub ya procesado, para descartar los reintentos de Twitch. */
	eventsubSeen: (messageId: string) => `eventsub:seen:${messageId}`,
	/** Id de Twitch a partir del login, para no preguntarlo en cada petición. */
	idFromLogin: (login: string) => `app:twitch:login:${login.toLowerCase()}`,
};
