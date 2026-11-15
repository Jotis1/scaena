// Qué meta sale (specs/obs-overlays, «Qué meta sale», «Rotación de metas» y «Meta cumplida en la rotación»; design.md
// del cambio goal-selector-and-rotation, decisión 4). El servidor calcula la vista entera y la publica cada vez que
// cambia algo: la cuenta, los ajustes o una meta de Twitch. Los overlays solo eligen la que toca por el reloj.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { GOAL_VIEW_EVENT, type GoalView, viewOf } from "./goal-pick";
import { type GoalState, readDone, readGoalSettings, readGoals } from "./saved-goal";
import { readTwitchGoals, twitchGoalState } from "./twitch-goal";

export { GOAL_VIEW_EVENT, type GoalView };

/** Todo lo de las metas de un canal: las de Scaena, las de Twitch, qué sale y lo que pintan los overlays. */
export interface GoalOverview {
	goals: GoalState[];
	twitchGoals: GoalState[];
	show: Awaited<ReturnType<typeof readGoalSettings>>["show"];
	endedTwitch?: string;
	/** Cuándo llegó cada meta a su objetivo (ms), por `ref`: el estudio lo usa para calcular la vista él mismo. */
	done: Record<string, number>;
	/** `null` sin ninguna meta: los overlays usan la de su URL. */
	view: GoalView | null;
}

export async function goalOverview(store: Store, channelId: string, now = Date.now()): Promise<GoalOverview> {
	const settings = await readGoalSettings(store, channelId);
	const [goals, twitch, done] = await Promise.all([
		readGoals(store, channelId),
		readTwitchGoals(store, channelId),
		readDone(store, channelId),
	]);
	const twitchGoals = twitch.map(twitchGoalState);
	const show = settings.show;
	return {
		goals,
		twitchGoals,
		show,
		...(settings.endedTwitch ? { endedTwitch: settings.endedTwitch } : {}),
		done,
		view: viewOf(goals, twitchGoals, show, done, now),
	};
}

/** Lo que pintan los overlays; `null` sin ninguna meta. */
export async function resolveGoalView(store: Store, channelId: string, now = Date.now()) {
	return (await goalOverview(store, channelId, now)).view;
}

/** Avisa a los overlays abiertos con la vista al día. Sin metas no manda nada: siguen con la de su URL. */
export async function publishGoalView(store: Store, channelId: string, now = Date.now()): Promise<void> {
	const view = await resolveGoalView(store, channelId, now);
	if (view)
		await store.xadd(keys.channel(channelId, "events"), {
			type: GOAL_VIEW_EVENT,
			data: JSON.stringify(view),
		});
}
