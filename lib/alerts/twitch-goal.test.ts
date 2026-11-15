import { describe, expect, it } from "vitest";
import { memoryStore } from "../storage/memory";
import * as F from "../twitch/eventsub/fixtures";
import { normalize } from "../twitch/eventsub/normalize";
import { readDone, readGoalSettings, saveGoal, saveShow, twitchRef } from "./saved-goal";
import {
	endTwitchGoal,
	parseTwitchGoal,
	readTwitchGoals,
	replaceTwitchGoals,
	saveTwitchGoal,
	type TwitchGoal,
	twitchGoalState,
} from "./twitch-goal";

const CHANNEL = "1337";
const TS = Date.parse("2026-11-04T17:00:00Z");
const goalOf = (n: typeof F.GOAL_PROGRESS) => {
	const r = normalize(n, "msg", TS);
	if (r.kind !== "goal") throw new Error(`se esperaba una meta y llegó ${r.kind}`);
	return r;
};
const FOLLOWERS = goalOf(F.GOAL_PROGRESS).goal;
const SUBS_TW: TwitchGoal = { ...goalOf(F.GOAL_BEGIN).goal, id: "subs-1", current: 10, startedAt: TS + 1 };
const SUBS = { type: "subs", label: "Meta de subs", target: 300 } as const;

// specs/twitch-events, «Seguimiento de la meta de Twitch»; specs/obs-overlays, «Meta de Twitch».
describe("metas de Twitch", () => {
	it("los avisos de meta se traducen con su fase", () => {
		expect(goalOf(F.GOAL_BEGIN)).toMatchObject({ phase: "begin", channelId: CHANNEL });
		expect(FOLLOWERS).toMatchObject({ twitchType: "follower", current: 950, target: 1000 });
		expect(goalOf(F.GOAL_END).phase).toBe("end");
	});

	it("una meta de seguidores con texto: su texto, su unidad y su ref", () => {
		expect(twitchGoalState(FOLLOWERS)).toEqual({
			type: "follows",
			label: "Hacia los 1.000",
			target: 1000,
			unit: "seguidores",
			current: 950,
			ref: "twitch:12345-abc-678-defgh",
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

	it("dos metas a la vez: el progreso de una no toca la otra", async () => {
		const s = memoryStore();
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		await saveTwitchGoal(s, CHANNEL, SUBS_TW);
		await saveTwitchGoal(s, CHANNEL, { ...SUBS_TW, current: 11 });
		expect((await readTwitchGoals(s, CHANNEL)).map((g) => [g.id, g.current])).toEqual([
			["12345-abc-678-defgh", 950],
			["subs-1", 11],
		]);
	});

	it("un progreso repetido no suma dos veces", async () => {
		const s = memoryStore();
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		expect((await readTwitchGoals(s, CHANNEL)).map((g) => g.current)).toEqual([950]);
	});

	it("acaba una de dos: sigue la otra, y la que salía no cambia", async () => {
		const s = memoryStore();
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		await saveTwitchGoal(s, CHANNEL, SUBS_TW);
		await saveShow(s, CHANNEL, { kind: "one", ref: twitchRef(FOLLOWERS.id) }, [FOLLOWERS.id, SUBS_TW.id]);
		await endTwitchGoal(s, CHANNEL, SUBS_TW.id);
		expect((await readTwitchGoals(s, CHANNEL)).map((g) => g.id)).toEqual([FOLLOWERS.id]);
		const settings = await readGoalSettings(s, CHANNEL);
		expect(settings.show).toEqual({ kind: "one", ref: twitchRef(FOLLOWERS.id) });
		expect(settings.endedTwitch).toBeUndefined();
	});

	it("acaba la elegida: vuelve la de por defecto y queda el aviso con su texto", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS });
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		await saveShow(s, CHANNEL, { kind: "one", ref: twitchRef(FOLLOWERS.id) }, [FOLLOWERS.id]);
		await endTwitchGoal(s, CHANNEL, FOLLOWERS.id);
		const settings = await readGoalSettings(s, CHANNEL);
		expect(settings.show).toBeUndefined();
		expect(settings.endedTwitch).toBe("Hacia los 1.000");
	});

	it("acaba una de la rotación: sale de ella", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS });
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		const items = [
			{ ref: a.ref, whenDone: "keep" as const },
			{ ref: twitchRef(FOLLOWERS.id), whenDone: "keep" as const },
		];
		await saveShow(s, CHANNEL, { kind: "rotate", every: 10, items }, [FOLLOWERS.id]);
		await endTwitchGoal(s, CHANNEL, FOLLOWERS.id);
		expect((await readGoalSettings(s, CHANNEL)).show).toEqual({
			kind: "rotate",
			every: 10,
			items: [items[0]],
		});
	});

	it("la que llega a su objetivo se apunta como cumplida, y al acabar se olvida", async () => {
		const s = memoryStore();
		await saveTwitchGoal(s, CHANNEL, { ...FOLLOWERS, current: 1000 });
		expect(Object.keys(await readDone(s, CHANNEL))).toEqual([twitchRef(FOLLOWERS.id)]);
		await endTwitchGoal(s, CHANNEL, FOLLOWERS.id);
		expect(await readDone(s, CHANNEL)).toEqual({});
	});

	it("sustituir por lo que hay en Twitch: las que ya no están terminan y se guardan las nuevas", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS });
		await saveTwitchGoal(s, CHANNEL, FOLLOWERS);
		await saveShow(s, CHANNEL, { kind: "one", ref: twitchRef(FOLLOWERS.id) }, [FOLLOWERS.id]);
		await replaceTwitchGoals(s, CHANNEL, [SUBS_TW]);
		expect((await readTwitchGoals(s, CHANNEL)).map((g) => g.id)).toEqual(["subs-1"]);
		expect((await readGoalSettings(s, CHANNEL)).endedTwitch).toBe("Hacia los 1.000");
	});
});
