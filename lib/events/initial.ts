// Lo que recibe un overlay nada más conectar (design.md, decisión 4): las frases de las alertas y, si hay metas, la
// vista de la meta (la elegida o la rotación) con las cuentas al día. El overlay pinta eso; no lo recalcula con los
// eventos reproducidos.
import { GOAL_VIEW_EVENT, resolveGoalView } from "../alerts/goal-view";
import { effectivePhrases, readSettings, SETTINGS_EVENT } from "../alerts/settings";
import type { Profile } from "../profile/schema";
import type { Store } from "../storage/types";

export async function initialEvents(
	store: Store,
	channelId: string,
	profile: Profile,
): Promise<{ event: string; data: string }[]> {
	const [settings, view] = await Promise.all([
		readSettings(store, channelId),
		resolveGoalView(store, channelId),
	]);
	return [
		{ event: SETTINGS_EVENT, data: JSON.stringify({ alerts: effectivePhrases(profile, settings) }) },
		...(view ? [{ event: GOAL_VIEW_EVENT, data: JSON.stringify(view) }] : []),
	];
}
