// Metas del creador activas en Twitch (specs/twitch-events, «Seguimiento de la meta de Twitch»; design.md del cambio
// goal-selector-and-rotation, decisiones 2 y 6). Llegan por EventSub (`channel.goal.*`) y por Helix
// (`GET /helix/goals`) y se guardan tal cual, cada una por su id en un hash: Twitch da cifras absolutas, así que un
// aviso repetido no suma dos veces, y dos avisos de metas distintas no se pisan.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { GOAL_LABELS, type GoalType } from "./goal";
import {
	forgetDone,
	type GoalState,
	readGoalSettings,
	syncDone,
	twitchRef,
	updateGoalSettings,
	withoutRef,
} from "./saved-goal";

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
	/** Cuándo empezó (ms): las metas de Twitch se ofrecen en ese orden. */
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
		ref: twitchRef(g.id),
		source: "twitch",
	};
}

const key = (channelId: string) => keys.channel(channelId, "twitch-goals");

const asGoal = (v: unknown): TwitchGoal | null => {
	// Upstash devuelve ya leído el JSON de cada campo; la memoria y el Redis de los tests, el texto.
	let g: unknown = v;
	if (typeof v === "string")
		try {
			g = JSON.parse(v);
		} catch {
			return null;
		}
	if (!g || typeof g !== "object") return null;
	const t = g as TwitchGoal;
	return typeof t.id === "string" && isType(t.twitchType) ? t : null;
};

/** Las metas de Twitch activas, de la que empezó antes a la que empezó después. */
export async function readTwitchGoals(store: Store, channelId: string): Promise<TwitchGoal[]> {
	const raw = await store.hgetall(key(channelId));
	return Object.values(raw)
		.map(asGoal)
		.filter((g): g is TwitchGoal => g !== null)
		.sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id));
}

/** Guarda o actualiza una meta (solo la suya) y apunta si ha llegado a su objetivo. */
export async function saveTwitchGoal(store: Store, channelId: string, g: TwitchGoal): Promise<void> {
	await store.hset(key(channelId), { [g.id]: JSON.stringify(g) });
	await syncDone(store, channelId, twitchRef(g.id), g.current, Math.max(1, g.target));
}

/**
 * Una meta de Twitch ha terminado: se borra solo esa. Si era la elegida, vuelve la meta de Scaena por defecto y se
 * guarda su texto para que el estudio lo avise; si estaba en la rotación, sale de ella (specs/obs-overlays, «Meta de
 * Twitch» y «Rotación de metas»).
 */
export async function endTwitchGoal(store: Store, channelId: string, id: string): Promise<void> {
	const ref = twitchRef(id);
	const saved = (await readTwitchGoals(store, channelId)).find((g) => g.id === id);
	await store.hdel(key(channelId), id);
	await forgetDone(store, channelId, ref);
	const { show } = await readGoalSettings(store, channelId);
	if (!show) return;
	const chosen = show.kind === "one" && show.ref === ref;
	const rotating = show.kind === "rotate" && show.items.some((i) => i.ref === ref);
	if (!chosen && !rotating) return;
	await updateGoalSettings(store, channelId, (s) => {
		const next = { ...s };
		const left = withoutRef(s.show, ref);
		if (left) next.show = left;
		else delete next.show;
		if (chosen) next.endedTwitch = saved ? twitchGoalState(saved).label : "Tu meta de Twitch";
		return next;
	});
}

/**
 * Sustituye las metas guardadas por las que hay en Twitch (al conectar y al abrir el estudio). Las que ya no están se
 * tratan como un final. La clave antigua de la 0.3.0, con una sola meta, se borra.
 */
export async function replaceTwitchGoals(
	store: Store,
	channelId: string,
	goals: TwitchGoal[],
): Promise<void> {
	const ids = new Set(goals.map((g) => g.id));
	for (const old of await readTwitchGoals(store, channelId))
		if (!ids.has(old.id)) await endTwitchGoal(store, channelId, old.id);
	for (const g of goals) await saveTwitchGoal(store, channelId, g);
	await store.del(keys.channel(channelId, "twitch-goal"));
}
