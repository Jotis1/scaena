// Qué meta sale (specs/obs-overlays, «Qué meta sale», «Rotación de metas» y «Meta cumplida en la rotación»; design.md
// del cambio goal-selector-and-rotation, decisión 4). El servidor calcula la vista entera y la publica cada vez que
// cambia algo: la cuenta, los ajustes o una meta de Twitch. Los overlays solo eligen la que toca por el reloj.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { GOAL_VIEW_EVENT, type GoalView } from "./goal-pick";
import { type GoalState, readDone, readGoalSettings, readGoals } from "./saved-goal";
import { readTwitchGoals, twitchGoalState } from "./twitch-goal";

export { GOAL_VIEW_EVENT, type GoalView };

/** Todo lo de las metas de un canal: las de Scaena, las de Twitch, qué sale y lo que pintan los overlays. */
export interface GoalOverview {
	goals: GoalState[];
	twitchGoals: GoalState[];
	show: Awaited<ReturnType<typeof readGoalSettings>>["show"];
	endedTwitch?: string;
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
	const byRef = new Map([...goals, ...twitchGoals].map((g) => [g.ref as string, g]));
	const fallback = goals[0] ?? null;
	const show = settings.show;
	let view: GoalView | null = fallback ? { kind: "one", goal: fallback } : null;

	if (show?.kind === "one") {
		const g = byRef.get(show.ref);
		if (g) view = { kind: "one", goal: g };
	} else if (show?.kind === "rotate") {
		const marked = show.items.filter((i) => byRef.has(i.ref));
		const left = marked.filter((i) => !(i.whenDone === "drop" && done[i.ref] !== undefined));
		let list = left.map((i) => byRef.get(i.ref) as GoalState);
		// Todas han salido al cumplirse: se queda la última que salió.
		if (!list.length && marked.length) {
			const last = marked.reduce((a, b) => ((done[b.ref] ?? 0) > (done[a.ref] ?? 0) ? b : a));
			list = [byRef.get(last.ref) as GoalState];
		}
		if (list.length === 1) view = { kind: "one", goal: list[0] as GoalState };
		else if (list.length > 1) view = { kind: "rotate", every: show.every, goals: list, serverNow: now };
	}
	return {
		goals,
		twitchGoals,
		show,
		...(settings.endedTwitch ? { endedTwitch: settings.endedTwitch } : {}),
		view,
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
