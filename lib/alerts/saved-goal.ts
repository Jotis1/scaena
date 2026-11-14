// Meta guardada en Scaena (specs/obs-overlays, «Meta editable en el estudio»; specs/twitch-events, «Eventos
// recientes y metas»; design.md del cambio obs-setup-guide-and-stored-goal, decisión 4). La configuración va en los
// ajustes (`channel:<id>:settings`) y la cuenta en un entero aparte (`channel:<id>:goal`): el stream se recorta a
// 10 minutos y la meta dura semanas. A los overlays les llega siempre el valor absoluto (evento `goal`), así que
// reconectar o tener varios abiertos no duplica nada.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import type { AlertEvent } from "../twitch/eventsub/event";
import { type GoalType, goalIncrement } from "./goal";
import { type AlertSettings, readSettings, SettingsError, settingsSchema } from "./settings";

/** Nombre del evento SSE con la meta y su cuenta. */
export const GOAL_EVENT = "goal";

export type GoalConfig = NonNullable<AlertSettings["goal"]>;

/** Lo que pinta un overlay: la meta y lo que se lleva. */
export interface GoalState extends GoalConfig {
	current: number;
}

export async function readGoal(store: Store, channelId: string): Promise<GoalState | null> {
	const { goal } = await readSettings(store, channelId);
	if (!goal) return null;
	const raw = await store.get<unknown>(keys.channel(channelId, "goal"));
	const current = Number(raw ?? 0);
	return { ...goal, current: Number.isFinite(current) && current > 0 ? Math.floor(current) : 0 };
}

async function publish(store: Store, channelId: string, g: GoalState): Promise<void> {
	await store.xadd(keys.channel(channelId, "events"), { type: GOAL_EVENT, data: JSON.stringify(g) });
}

/**
 * Valida y guarda la meta. Con `current`, la cuenta pasa a ese valor; sin él, se conserva (cambiar el texto o el
 * objetivo no la toca). Avisa a los overlays abiertos.
 */
export async function saveGoal(store: Store, channelId: string, input: unknown): Promise<GoalState> {
	const i = (input ?? {}) as { goal?: Record<string, unknown>; current?: unknown };
	const settings = await readSettings(store, channelId);
	const r = settingsSchema.safeParse({ alerts: settings.alerts, goal: i.goal ?? {} });
	const fields: Record<string, string> = {};
	if (!r.success) for (const issue of r.error.issues) fields[String(issue.path.at(-1))] ??= issue.message;
	const current = i.current;
	const validCurrent =
		current === undefined ||
		(typeof current === "number" && Number.isInteger(current) && current >= 0 && current <= 10_000_000);
	if (!validCurrent) fields.current = "Lo que llevas tiene que ser un número entero, cero o más.";
	if (!r.success || !validCurrent || !r.data.goal) throw new SettingsError(fields);

	await store.set(keys.channel(channelId, "settings"), r.data);
	if (typeof current === "number") await store.set(keys.channel(channelId, "goal"), current);
	const state = (await readGoal(store, channelId)) as GoalState;
	await publish(store, channelId, state);
	return state;
}

/**
 * Suma el evento a la meta guardada, si cuenta. Va después de descartar los duplicados de Twitch, así que cada
 * evento suma una sola vez, haya overlays abiertos o no. Las alertas de prueba no suman (`goalIncrement`).
 */
export async function countGoalEvent(store: Store, e: AlertEvent): Promise<GoalState | null> {
	const { goal } = await readSettings(store, e.channelId);
	if (!goal) return null;
	const n = goalIncrement(goal.type as GoalType, e);
	if (!n) return null;
	const current = await store.incrby(keys.channel(e.channelId, "goal"), n);
	const state = { ...goal, current };
	await publish(store, e.channelId, state);
	return state;
}
