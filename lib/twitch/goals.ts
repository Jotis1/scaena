// Metas activas del canal, pedidas a Twitch con el token del dueño (specs/twitch-events, «Seguimiento de la meta de
// Twitch»): al conectar los eventos y al abrir Overlays, para no esperar al siguiente aviso de EventSub.
// https://dev.twitch.tv/docs/api/reference/#get-creator-goals (pide `channel:read:goals`).
import { publishGoalView } from "../alerts/goal-view";
import { parseTwitchGoal, replaceTwitchGoals, type TwitchGoal } from "../alerts/twitch-goal";
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
 * Pregunta a Twitch las metas activas y sustituye las guardadas: las que ya no están cuentan como terminadas. Si
 * Twitch no contesta a tiempo o da error, se quedan las que había: devuelve `undefined`. Si no, las que quedan.
 * Avisa a los overlays con la vista al día.
 */
export async function syncTwitchGoals(d: GoalSyncDeps, channelId: string): Promise<TwitchGoal[] | undefined> {
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
			console.warn(`Metas de Twitch: Helix ha contestado ${res.status}; se quedan las que había.`);
			return undefined;
		}
		const { data } = (await res.json()) as { data?: Record<string, unknown>[] };
		const goals = (data ?? []).map(parseTwitchGoal).filter((g): g is TwitchGoal => g !== null);
		await replaceTwitchGoals(d.store, channelId, goals);
		await publishGoalView(d.store, channelId);
		return goals;
	} catch (e) {
		console.warn(`Metas de Twitch: no se ha podido preguntar (${e instanceof Error ? e.message : e}).`);
		return undefined;
	}
}
