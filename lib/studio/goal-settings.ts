// Las metas del canal desde el estudio (specs/obs-overlays, «Meta editable en el estudio», «Qué meta sale» y
// «Rotación de metas»; design.md del cambio goal-selector-and-rotation, decisión 8). Separado de la ruta para probarlo
// con el almacén en memoria. Cada cambio avisa a los overlays abiertos con la vista al día.
import { goalOverview, publishGoalView } from "../alerts/goal-view";
import { deleteGoal, dismissEnded, saveGoal, saveShow } from "../alerts/saved-goal";
import { SettingsError } from "../alerts/settings";
import { readTwitchGoals } from "../alerts/twitch-goal";
import type { Store } from "../storage/types";

export interface GoalReply {
	status: number;
	body: unknown;
}

const fail = (e: unknown): GoalReply => {
	if (e instanceof SettingsError) return { status: 400, body: { error: e.message, fields: e.fields } };
	throw e;
};

/** Todo lo de las metas: las de Scaena, las de Twitch, qué sale, el aviso y la vista. */
export async function readGoalPanel(store: Store, channelId: string) {
	return goalOverview(store, channelId);
}

/**
 * `PUT` de las metas: `{ goal, current? }` crea o edita una meta, `{ show }` elige qué sale y `{ dismissEnded }`
 * cierra el aviso. `null` si el cuerpo no es de las metas (son las frases).
 */
export async function putGoals(store: Store, channelId: string, body: unknown): Promise<GoalReply | null> {
	if (!body || typeof body !== "object") return null;
	const b = body as Record<string, unknown>;
	try {
		if ("goal" in b) {
			const goal = await saveGoal(store, channelId, b);
			await publishGoalView(store, channelId);
			return { status: 200, body: { goal, ...(await readGoalPanel(store, channelId)) } };
		}
		if ("show" in b) {
			const ids = (await readTwitchGoals(store, channelId)).map((g) => g.id);
			await saveShow(store, channelId, b.show, ids);
			await publishGoalView(store, channelId);
			return { status: 200, body: await readGoalPanel(store, channelId) };
		}
		if (b.dismissEnded === true) {
			await dismissEnded(store, channelId);
			return { status: 200, body: await readGoalPanel(store, channelId) };
		}
	} catch (e) {
		return fail(e);
	}
	return null;
}

/** `DELETE ?goal=<id>`: borra una meta. La última no se borra. */
export async function deleteGoalRequest(store: Store, channelId: string, url: URL): Promise<GoalReply> {
	const id = url.searchParams.get("goal");
	if (!id) return { status: 400, body: { error: "Falta la meta que se borra (`?goal=`)." } };
	try {
		await deleteGoal(store, channelId, id);
	} catch (e) {
		return fail(e);
	}
	await publishGoalView(store, channelId);
	return { status: 200, body: await readGoalPanel(store, channelId) };
}
