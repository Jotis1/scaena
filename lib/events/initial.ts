// Lo que recibe un overlay nada más conectar (design.md, decisión 4): las frases de las alertas y, si hay meta
// guardada, la meta con la cuenta al día. El overlay pinta ese valor; no lo recalcula con los eventos reproducidos.
import { GOAL_EVENT, readGoal } from "../alerts/saved-goal";
import { effectivePhrases, readSettings, SETTINGS_EVENT } from "../alerts/settings";
import type { Profile } from "../profile/schema";
import type { Store } from "../storage/types";

export async function initialEvents(
	store: Store,
	channelId: string,
	profile: Profile,
): Promise<{ event: string; data: string }[]> {
	const [settings, goal] = await Promise.all([readSettings(store, channelId), readGoal(store, channelId)]);
	return [
		{ event: SETTINGS_EVENT, data: JSON.stringify({ alerts: effectivePhrases(profile, settings) }) },
		...(goal ? [{ event: GOAL_EVENT, data: JSON.stringify(goal) }] : []),
	];
}
