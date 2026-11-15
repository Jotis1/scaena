import { describe, expect, it } from "vitest";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import type { AlertEvent } from "../twitch/eventsub/event";
import * as F from "../twitch/eventsub/fixtures";
import { normalize } from "../twitch/eventsub/normalize";
import { countGoalEvent, GOAL_EVENT, resolveGoal, saveGoal } from "./saved-goal";
import {
	clearTwitchGoal,
	latestGoal,
	parseTwitchGoal,
	readTwitchGoal,
	saveTwitchGoal,
	twitchGoalState,
} from "./twitch-goal";

const CHANNEL = "1337";
const TS = Date.parse("2026-11-04T17:00:00Z");
const goalOf = (n: typeof F.GOAL_PROGRESS) => {
	const r = normalize(n, "msg", TS);
	if (r.kind !== "goal") throw new Error(`se esperaba una meta y llegó ${r.kind}`);
	return r;
};
const SUBS = { type: "subs", label: "Meta de subs", target: 300 } as const;

// specs/twitch-events, «Seguimiento de la meta de Twitch»; specs/obs-overlays, «Meta de Twitch».
describe("meta de Twitch", () => {
	it("los avisos de meta se traducen con su fase", () => {
		expect(goalOf(F.GOAL_BEGIN)).toMatchObject({ phase: "begin", channelId: CHANNEL });
		expect(goalOf(F.GOAL_PROGRESS).goal).toMatchObject({
			twitchType: "follower",
			current: 950,
			target: 1000,
		});
		expect(goalOf(F.GOAL_END).phase).toBe("end");
	});

	it("una meta de seguidores con texto: su texto y su unidad", () => {
		expect(twitchGoalState(goalOf(F.GOAL_PROGRESS).goal)).toEqual({
			type: "follows",
			label: "Hacia los 1.000",
			target: 1000,
			unit: "seguidores",
			current: 950,
			source: "twitch",
		});
	});

	it("sin texto, el del tipo; `new_cheerer` va en personas", () => {
		expect(twitchGoalState(goalOf(F.GOAL_BEGIN).goal)).toMatchObject({
			label: "Meta de subs",
			unit: "subs",
		});
		expect(twitchGoalState(goalOf(F.GOAL_CHEERERS).goal)).toMatchObject({ unit: "personas" });
	});

	it("una meta sin tipo conocido o sin objetivo no vale", () => {
		expect(parseTwitchGoal({ id: "x", type: "otra", target_amount: 3 })).toBeNull();
		expect(parseTwitchGoal({ id: "x", type: "follower" })).toBeNull();
	});

	it("manda sobre la de Scaena y, al borrarla, vuelve la de Scaena", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 10 });
		await saveTwitchGoal(s, CHANNEL, goalOf(F.GOAL_PROGRESS).goal);
		expect(await resolveGoal(s, CHANNEL)).toMatchObject({ source: "twitch", current: 950 });
		await clearTwitchGoal(s, CHANNEL, "12345-abc-678-defgh");
		expect(await resolveGoal(s, CHANNEL)).toMatchObject({ source: "scaena", current: 10 });
	});

	it("un final de otra meta no borra la que hay", async () => {
		const s = memoryStore();
		await saveTwitchGoal(s, CHANNEL, goalOf(F.GOAL_PROGRESS).goal);
		await clearTwitchGoal(s, CHANNEL, "otra");
		expect(await readTwitchGoal(s, CHANNEL)).not.toBeNull();
	});

	it("un progreso repetido no suma dos veces", async () => {
		const s = memoryStore();
		const g = goalOf(F.GOAL_PROGRESS).goal;
		await saveTwitchGoal(s, CHANNEL, g);
		await saveTwitchGoal(s, CHANNEL, g);
		expect((await resolveGoal(s, CHANNEL))?.current).toBe(950);
	});

	it("con meta de Twitch, la de Scaena sigue contando pero no se publica", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 10 });
		await saveTwitchGoal(s, CHANNEL, goalOf(F.GOAL_PROGRESS).goal);
		const before = (await s.xrange(keys.channel(CHANNEL, "events"))).length;
		const sub: AlertEvent = { id: "e", ts: TS, channelId: CHANNEL, type: "sub", user: "A" };
		expect((await countGoalEvent(s, sub))?.current).toBe(11);
		const after = await s.xrange(keys.channel(CHANNEL, "events"));
		expect(after.filter((e) => e.fields.type === GOAL_EVENT)).toHaveLength(before);
	});

	it("de varias metas activas, la más reciente", () => {
		const a = { ...goalOf(F.GOAL_PROGRESS).goal, id: "a", startedAt: 1 };
		const b = { ...a, id: "b", startedAt: 2 };
		expect(latestGoal([a, b])?.id).toBe("b");
		expect(latestGoal([])).toBeNull();
	});
});
