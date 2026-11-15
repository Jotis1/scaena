import { describe, expect, it } from "vitest";
import { GOAL_VIEW_EVENT } from "../alerts/goal-view";
import { readTwitchGoals, saveTwitchGoal } from "../alerts/twitch-goal";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { type GoalSyncDeps, syncTwitchGoals } from "./goals";

const goal = (id: string, started: string, type = "follower", current = 950) => ({
	id,
	broadcaster_id: "1337",
	type,
	description: "Hacia los 1.000",
	current_amount: current,
	target_amount: 1000,
	created_at: started,
});
const STORED = {
	id: "a",
	twitchType: "follower",
	description: "",
	current: 1,
	target: 2,
	startedAt: 0,
} as const;

function deps(response: () => Response | Promise<Response>, store = memoryStore()): GoalSyncDeps {
	return { store, clientId: "cid", userToken: async () => "user-token", fetch: async () => response() };
}

// specs/twitch-events, «Seguimiento de la meta de Twitch», «Meta ya activa al conectar».
describe("metas de Twitch pedidas a Helix", () => {
	it("las metas ya activas se guardan todas, sin esperar al siguiente aviso", async () => {
		const d = deps(() =>
			Response.json({
				data: [
					goal("seguidores", "2026-11-01T10:00:00Z"),
					goal("bits", "2026-10-01T10:00:00Z", "new_bit", 200),
				],
			}),
		);
		expect((await syncTwitchGoals(d, "1337"))?.map((g) => g.id)).toEqual(["seguidores", "bits"]);
		expect((await readTwitchGoals(d.store, "1337")).map((g) => [g.id, g.current])).toEqual([
			["bits", 200],
			["seguidores", 950],
		]);
	});

	it("sin ninguna, se borran las guardadas", async () => {
		const d = deps(() => Response.json({ data: [] }));
		await saveTwitchGoal(d.store, "1337", STORED);
		expect(await syncTwitchGoals(d, "1337")).toEqual([]);
		expect(await readTwitchGoals(d.store, "1337")).toEqual([]);
	});

	it("si Twitch falla, se quedan las que había", async () => {
		const d = deps(() => new Response("no", { status: 401 }));
		await saveTwitchGoal(d.store, "1337", STORED);
		expect(await syncTwitchGoals(d, "1337")).toBeUndefined();
		expect((await readTwitchGoals(d.store, "1337")).map((g) => g.id)).toEqual(["a"]);
		const down = { ...deps(() => Promise.reject(new Error("timeout"))), store: d.store };
		expect(await syncTwitchGoals(down, "1337")).toBeUndefined();
	});

	it("con metas de Scaena, avisa a los overlays con la vista al día", async () => {
		const d = deps(() => Response.json({ data: [goal("a", "2026-11-01T10:00:00Z")] }));
		await d.store.set(keys.channel("1337", "settings"), {
			alerts: {},
			goals: [{ id: "abcd1234", type: "subs", label: "Subs", target: 10 }],
		});
		await syncTwitchGoals(d, "1337");
		const views = (await d.store.xrange(keys.channel("1337", "events"))).filter(
			(e) => e.fields.type === GOAL_VIEW_EVENT,
		);
		expect(views).toHaveLength(1);
	});
});
