// Metas de Scaena (specs/obs-overlays, «Meta editable en el estudio»; specs/twitch-events, «Eventos recientes y
// metas»; design.md del cambio goal-selector-and-rotation, decisiones 1 a 3 y 5). La configuración va en los ajustes
// (`channel:<id>:settings`, `goals`) y la cuenta de cada una en un entero aparte (`channel:<id>:goal:<id>`): un
// `INCRBY` no compite con quien guarda los ajustes. Aquí solo se guarda y se cuenta; avisar a los overlays con lo que
// tienen que pintar es cosa de `goal-view.ts`, y lo hace quien cambia algo.
import { GOAL_ID, keys } from "../redis/keys";
import type { Store } from "../storage/types";
import type { AlertEvent } from "../twitch/eventsub/event";
import { type GoalType, goalIncrement } from "./goal";
import {
	type AlertSettings,
	type GoalConfig,
	type GoalRef,
	type GoalShow,
	goalFieldsSchema,
	MAX_GOALS,
	readSettings,
	SettingsError,
	settingsSchema,
	showSchema,
} from "./settings";

export type { GoalConfig, GoalRef, GoalShow };

/** Lo que pinta un overlay: una meta, de Scaena o de Twitch, con lo que se lleva. */
export interface GoalState {
	ref: GoalRef;
	source: "twitch" | "scaena";
	type: GoalType;
	label: string;
	target: number;
	unit?: string;
	current: number;
}

export const scaenaRef = (id: string): GoalRef => `scaena:${id}`;
export const twitchRef = (id: string): GoalRef => `twitch:${id}`;

const settingsKey = (channelId: string) => keys.channel(channelId, "settings");
const doneKey = (channelId: string) => keys.channel(channelId, "goal-done");

function newGoalId(): string {
	const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

const count = (raw: unknown) => {
	const n = Number(raw ?? 0);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

async function writeSettings(store: Store, channelId: string, s: AlertSettings): Promise<void> {
	const { goal: _legacy, ...rest } = s;
	await store.set(settingsKey(channelId), settingsSchema.parse(rest));
}

/** Id de la meta que viene de la 0.3.0: siempre el mismo, para que dos migraciones a la vez escriban la misma. */
const LEGACY_ID = "legacy00";

/**
 * Pasa la meta única de la 0.3.0 a la lista, con su cuenta, una sola vez (design.md, decisión 3). La cuenta se copia
 * con `nx` y el id es fijo: si dos lecturas migran a la vez, la segunda no pisa la cuenta de la primera, aunque lea la
 * clave antigua ya borrada.
 */
async function migrateLegacy(store: Store, channelId: string, s: AlertSettings): Promise<AlertSettings> {
	if (!s.goal || s.goals?.length) return s;
	const id = LEGACY_ID;
	const legacyCount = keys.channel(channelId, "goal");
	await store.set(keys.goalCount(channelId, id), count(await store.get(legacyCount)), { nx: true });
	const next: AlertSettings = { ...s, goals: [{ id, ...s.goal }] };
	delete next.goal;
	await writeSettings(store, channelId, next);
	await store.del(legacyCount);
	await store.del(keys.channel(channelId, "twitch-goal"));
	return next;
}

/** Los ajustes ya migrados: las frases, las metas de Scaena y qué meta sale. */
export async function readGoalSettings(store: Store, channelId: string): Promise<AlertSettings> {
	return migrateLegacy(store, channelId, await readSettings(store, channelId));
}

/** Las metas de Scaena, en su orden (la primera es la de por defecto), con la cuenta al día. */
export async function readGoals(store: Store, channelId: string): Promise<GoalState[]> {
	const { goals = [] } = await readGoalSettings(store, channelId);
	const counts = await Promise.all(goals.map((g) => store.get<unknown>(keys.goalCount(channelId, g.id))));
	return goals.map((g, i) => ({
		ref: scaenaRef(g.id),
		source: "scaena",
		type: g.type,
		label: g.label,
		target: g.target,
		...(g.unit ? { unit: g.unit } : {}),
		current: count(counts[i]),
	}));
}

/** Cuándo llegó cada meta a su objetivo (ms), por `ref`. */
export async function readDone(store: Store, channelId: string): Promise<Record<string, number>> {
	const raw = await store.hgetall(doneKey(channelId));
	return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]));
}

/** Apunta o borra que la meta ha llegado a su objetivo, según su cuenta (design.md, decisión 5). */
export async function syncDone(
	store: Store,
	channelId: string,
	ref: GoalRef,
	current: number,
	target: number,
	now = Date.now(),
): Promise<void> {
	if (current < target) return store.hdel(doneKey(channelId), ref);
	const done = await store.hgetall(doneKey(channelId));
	if (done[ref] === undefined) await store.hset(doneKey(channelId), { [ref]: String(now) });
}

export async function forgetDone(store: Store, channelId: string, ref: GoalRef): Promise<void> {
	await store.hdel(doneKey(channelId), ref);
}

/** Quita una meta de la elección: si salía fija, vuelve la de por defecto; si rotaba, sale de la rotación. */
export function withoutRef(show: GoalShow | undefined, ref: GoalRef): GoalShow | undefined {
	if (!show) return undefined;
	if (show.kind === "one") return show.ref === ref ? undefined : show;
	const items = show.items.filter((i) => i.ref !== ref);
	return items.length ? { ...show, items } : undefined;
}

const fieldErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
	const fields: Record<string, string> = {};
	for (const i of issues) fields[String(i.path.at(-1) ?? "goal")] ??= i.message;
	return fields;
};

/**
 * Crea (sin `id`) o edita una meta. Con `current`, la cuenta pasa a ese valor; sin él, se conserva: cambiar el texto o
 * el objetivo no la toca. Una meta nueva empieza en `current` o en 0.
 */
export async function saveGoal(store: Store, channelId: string, input: unknown): Promise<GoalState> {
	const i = (input ?? {}) as { goal?: Record<string, unknown>; current?: unknown };
	const settings = await readGoalSettings(store, channelId);
	const goals = settings.goals ?? [];
	const r = goalFieldsSchema.safeParse(i.goal ?? {});
	const fields: Record<string, string> = r.success ? {} : fieldErrors(r.error.issues);
	const current = i.current;
	const validCurrent =
		current === undefined ||
		(typeof current === "number" && Number.isInteger(current) && current >= 0 && current <= 10_000_000);
	if (!validCurrent) fields.current = "Lo que llevas tiene que ser un número entero, cero o más.";
	const id = typeof i.goal?.id === "string" ? i.goal.id : undefined;
	const index = id === undefined ? -1 : goals.findIndex((g) => g.id === id);
	if (id !== undefined && index < 0) fields.goal = "Esa meta ya no existe.";
	if (id === undefined && goals.length >= MAX_GOALS) fields.goal = `Como mucho, ${MAX_GOALS} metas.`;
	if (!r.success || Object.keys(fields).length)
		throw new SettingsError(fields, "La meta no se puede guardar.");

	const goalId = id ?? newGoalId();
	const config: GoalConfig = { id: goalId, ...r.data };
	const next = index < 0 ? [...goals, config] : goals.map((g, n) => (n === index ? config : g));
	await writeSettings(store, channelId, { ...settings, goals: next });
	const countKey = keys.goalCount(channelId, goalId);
	if (typeof current === "number") await store.set(countKey, current);
	else if (index < 0) await store.set(countKey, 0);
	const state = (await readGoals(store, channelId)).find((g) => g.ref === scaenaRef(goalId)) as GoalState;
	await syncDone(store, channelId, state.ref, state.current, state.target);
	return state;
}

/** Borra una meta, su cuenta y su marca de cumplida. La última no se borra (siempre queda una). */
export async function deleteGoal(store: Store, channelId: string, id: string): Promise<void> {
	const settings = await readGoalSettings(store, channelId);
	const goals = settings.goals ?? [];
	if (!GOAL_ID.test(id) || !goals.some((g) => g.id === id))
		throw new SettingsError({ goal: "Esa meta ya no existe." }, "La meta no se puede borrar.");
	if (goals.length === 1)
		throw new SettingsError(
			{ goal: "Tiene que quedar al menos una meta." },
			"La meta no se puede borrar.",
		);
	const ref = scaenaRef(id);
	const next: AlertSettings = { ...settings, goals: goals.filter((g) => g.id !== id) };
	const show = withoutRef(settings.show, ref);
	if (show) next.show = show;
	else delete next.show;
	await writeSettings(store, channelId, next);
	await store.del(keys.goalCount(channelId, id));
	await forgetDone(store, channelId, ref);
}

/**
 * Guarda qué meta sale. Cada `ref` tiene que ser de una meta que existe: `twitchIds` son las metas de Twitch activas.
 * Elegir quita el aviso de la meta de Twitch que terminó.
 */
export async function saveShow(
	store: Store,
	channelId: string,
	input: unknown,
	twitchIds: string[],
): Promise<GoalShow> {
	const r = showSchema.safeParse(input);
	if (!r.success)
		throw new SettingsError(fieldErrors(r.error.issues), "No se puede guardar qué meta sale.");
	const settings = await readGoalSettings(store, channelId);
	const valid = new Set<string>([
		...(settings.goals ?? []).map((g) => scaenaRef(g.id)),
		...twitchIds.map(twitchRef),
	]);
	const refs = r.data.kind === "one" ? [r.data.ref] : r.data.items.map((i) => i.ref);
	if (refs.some((ref) => !valid.has(ref)))
		throw new SettingsError({ show: "Esa meta ya no existe." }, "No se puede guardar qué meta sale.");
	const next: AlertSettings = { ...settings, show: r.data };
	delete next.endedTwitch;
	await writeSettings(store, channelId, next);
	return r.data;
}

/** Cierra el aviso de que la meta de Twitch elegida terminó. */
export async function dismissEnded(store: Store, channelId: string): Promise<void> {
	const settings = await readGoalSettings(store, channelId);
	if (settings.endedTwitch === undefined) return;
	const next = { ...settings };
	delete next.endedTwitch;
	await writeSettings(store, channelId, next);
}

/** Cambia los ajustes de las metas a partir de los que hay (para quien no es este módulo: el final de Twitch). */
export async function updateGoalSettings(
	store: Store,
	channelId: string,
	change: (s: AlertSettings) => AlertSettings,
): Promise<void> {
	await writeSettings(store, channelId, change(await readGoalSettings(store, channelId)));
}

/**
 * Suma el evento a cada meta de su tipo, salga o no (specs/twitch-events, «Eventos recientes y metas»), y apunta la
 * que llega a su objetivo. Va después de descartar los duplicados de Twitch, así que cada evento suma una sola vez,
 * haya overlays abiertos o no. Las alertas de prueba no suman (`goalIncrement`). Devuelve las metas que han cambiado.
 */
export async function countGoalEvent(store: Store, e: AlertEvent, now = Date.now()): Promise<GoalState[]> {
	const { goals = [] } = await readGoalSettings(store, e.channelId);
	const changed: GoalState[] = [];
	for (const g of goals) {
		const n = goalIncrement(g.type, e);
		if (!n) continue;
		const current = await store.incrby(keys.goalCount(e.channelId, g.id), n);
		const ref = scaenaRef(g.id);
		if (current - n < g.target && current >= g.target)
			await store.hset(doneKey(e.channelId), { [ref]: String(now) });
		changed.push({
			ref,
			source: "scaena",
			type: g.type,
			label: g.label,
			target: g.target,
			...(g.unit ? { unit: g.unit } : {}),
			current,
		});
	}
	return changed;
}
