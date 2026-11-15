// Meta activa del canal, pedida a Twitch con el token del dueño (specs/twitch-events, «Seguimiento de la meta de
// Twitch»): al conectar los eventos y al abrir Overlays, para no esperar al siguiente aviso de EventSub.
// https://dev.twitch.tv/docs/api/reference/#get-creator-goals (pide `channel:read:goals`).
import {
	clearTwitchGoal,
	latestGoal,
	parseTwitchGoal,
	saveTwitchGoal,
	type TwitchGoal,
} from "../alerts/twitch-goal";
import type { Store } from "../storage/types";
import { HELIX_URL } from "./helix";

export interface GoalSyncDeps {
	store: Store;
	clientId: string;
	/** Token de usuario del dueño del canal; sin él, no se pregunta. */
	userToken: () => Promise<string | null>;
	fetch?: typeof fetch;
	timeoutMs?: number;
}

/**
 * Pregunta a Twitch la meta activa y la guarda (o la borra si no hay ninguna). Si Twitch no contesta a tiempo o da
 * error, se queda la que había: devuelve `undefined`. Si no, la meta que queda (`null` sin ninguna).
 */
export async function syncTwitchGoal(
	d: GoalSyncDeps,
	channelId: string,
): Promise<TwitchGoal | null | undefined> {
	try {
		const token = await d.userToken();
		if (!token) return undefined;
		const res = await (d.fetch ?? fetch)(
			`${HELIX_URL}/goals?broadcaster_id=${encodeURIComponent(channelId)}`,
			{
				headers: { "client-id": d.clientId, authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(d.timeoutMs ?? 2000),
			},
		);
		if (!res.ok) {
			console.warn(`Meta de Twitch: Helix ha contestado ${res.status}; se queda la que había.`);
			return undefined;
		}
		const { data } = (await res.json()) as { data?: Record<string, unknown>[] };
		const goal = latestGoal((data ?? []).map(parseTwitchGoal).filter((g): g is TwitchGoal => g !== null));
		if (goal) await saveTwitchGoal(d.store, channelId, goal);
		else await clearTwitchGoal(d.store, channelId);
		return goal;
	} catch (e) {
		console.warn(`Meta de Twitch: no se ha podido preguntar (${e instanceof Error ? e.message : e}).`);
		return undefined;
	}
}
