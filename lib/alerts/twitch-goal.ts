// Meta del creador activa en Twitch (specs/twitch-events, «Seguimiento de la meta de Twitch»; design.md del cambio
// studio-sidebar-twitch-goals-editable-profile, decisión 6). Llega por EventSub (`channel.goal.*`) y por Helix
// (`GET /helix/goals`) y se guarda tal cual: Twitch da cifras absolutas, así que un aviso repetido no suma dos veces.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { GOAL_LABELS, type GoalType } from "./goal";
import type { GoalState } from "./saved-goal";

/** Tipos de meta de Twitch: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goals-event */
export const TWITCH_GOAL_TYPES = [
	"follower",
	"subscription",
	"subscription_count",
	"new_subscription",
	"new_subscription_count",
	"new_bit",
	"new_cheerer",
] as const;
export type TwitchGoalType = (typeof TWITCH_GOAL_TYPES)[number];

/** Cada tipo de Twitch en Scaena: el tipo (para el texto por defecto) y la unidad. */
const MAPPING: Record<TwitchGoalType, { type: GoalType; unit: string }> = {
	follower: { type: "follows", unit: "seguidores" },
	subscription: { type: "subs", unit: "puntos de sub" },
	new_subscription: { type: "subs", unit: "puntos de sub" },
	subscription_count: { type: "subs", unit: "subs" },
	new_subscription_count: { type: "subs", unit: "subs" },
	new_bit: { type: "bits", unit: "bits" },
	new_cheerer: { type: "bits", unit: "personas" },
};

export interface TwitchGoal {
	id: string;
	twitchType: TwitchGoalType;
	description: string;
	current: number;
	target: number;
	/** Cuándo empezó (ms): con varias activas, vale la más reciente. */
	startedAt: number;
}

const isType = (t: unknown): t is TwitchGoalType => (TWITCH_GOAL_TYPES as readonly unknown[]).includes(t);
const num = (v: unknown) =>
	typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;

/** Una meta de Twitch, del aviso de EventSub o de Helix (los dos usan los mismos campos). `null` si no vale. */
export function parseTwitchGoal(raw: Record<string, unknown>): TwitchGoal | null {
	const id = typeof raw.id === "string" && raw.id ? raw.id : undefined;
	const type = raw.type;
	const target = num(raw.target_amount);
	if (!id || !isType(type) || target === undefined) return null;
	const started = Date.parse(String(raw.started_at ?? raw.created_at ?? ""));
	return {
		id,
		twitchType: type,
		description: typeof raw.description === "string" ? raw.description.trim().slice(0, 40) : "",
		current: num(raw.current_amount) ?? 0,
		target,
		startedAt: Number.isFinite(started) ? started : 0,
	};
}

/** Lo que pinta un overlay con la meta de Twitch: su descripción (o el texto del tipo) y su unidad. */
export function twitchGoalState(g: TwitchGoal): GoalState {
	const { type, unit } = MAPPING[g.twitchType];
	return {
		type,
		label: g.description || GOAL_LABELS[type],
		target: Math.max(1, g.target),
		unit,
		current: g.current,
		source: "twitch",
	};
}

const key = (channelId: string) => keys.channel(channelId, "twitch-goal");

export async function readTwitchGoal(store: Store, channelId: string): Promise<TwitchGoal | null> {
	const raw = await store.get<TwitchGoal>(key(channelId));
	return raw && typeof raw === "object" && isType(raw.twitchType) ? raw : null;
}

export async function saveTwitchGoal(store: Store, channelId: string, g: TwitchGoal): Promise<void> {
	await store.set(key(channelId), g);
}

/** Borra la meta de Twitch guardada; con `id`, solo si es esa (un final atrasado no borra la siguiente). */
export async function clearTwitchGoal(store: Store, channelId: string, id?: string): Promise<void> {
	if (id !== undefined) {
		const saved = await readTwitchGoal(store, channelId);
		if (saved && saved.id !== id) return;
	}
	await store.del(key(channelId));
}

/** De varias metas activas, la más reciente; `null` sin ninguna. */
export function latestGoal(goals: TwitchGoal[]): TwitchGoal | null {
	return goals.reduce<TwitchGoal | null>((a, g) => (!a || g.startedAt > a.startedAt ? g : a), null);
}
