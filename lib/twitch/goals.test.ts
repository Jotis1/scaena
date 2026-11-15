import { describe, expect, it } from "vitest";
import { readTwitchGoal, saveTwitchGoal } from "../alerts/twitch-goal";
import { memoryStore } from "../storage/memory";
import { type GoalSyncDeps, syncTwitchGoal } from "./goals";

const goal = (id: string, started: string, current = 950) => ({
	id,
	broadcaster_id: "1337",
	type: "follower",
	description: "Hacia los 1.000",
	current_amount: current,
	target_amount: 1000,
	created_at: started,
});

function deps(response: () => Response | Promise<Response>, store = memoryStore()): GoalSyncDeps {
	return { store, clientId: "cid", userToken: async () => "user-token", fetch: async () => response() };
}

// specs/twitch-events, «Seguimiento de la meta de Twitch», «Meta ya activa al conectar».
describe("meta de Twitch pedida a Helix", () => {
	it("una meta ya activa se guarda sin esperar al siguiente aviso", async () => {
		const d = deps(() => Response.json({ data: [goal("a", "2026-11-01T10:00:00Z")] }));
		expect((await syncTwitchGoal(d, "1337"))?.current).toBe(950);
		expect((await readTwitchGoal(d.store, "1337"))?.id).toBe("a");
	});

	it("con varias, la más reciente", async () => {
		const d = deps(() =>
			Response.json({
				data: [goal("vieja", "2026-10-01T10:00:00Z"), goal("nueva", "2026-11-01T10:00:00Z", 3)],
			}),
		);
		expect((await syncTwitchGoal(d, "1337"))?.id).toBe("nueva");
	});

	it("sin ninguna, se borra la guardada", async () => {
		const d = deps(() => Response.json({ data: [] }));
		await saveTwitchGoal(d.store, "1337", {
			id: "a",
			twitchType: "follower",
			description: "",
			current: 1,
			target: 2,
			startedAt: 0,
		});
		expect(await syncTwitchGoal(d, "1337")).toBeNull();
		expect(await readTwitchGoal(d.store, "1337")).toBeNull();
	});

	it("si Twitch falla, se queda la que había", async () => {
		const d = deps(() => new Response("no", { status: 401 }));
		await saveTwitchGoal(d.store, "1337", {
			id: "a",
			twitchType: "follower",
			description: "",
			current: 1,
			target: 2,
			startedAt: 0,
		});
		expect(await syncTwitchGoal(d, "1337")).toBeUndefined();
		expect((await readTwitchGoal(d.store, "1337"))?.id).toBe("a");
		const down = { ...deps(() => Promise.reject(new Error("timeout"))), store: d.store };
		expect(await syncTwitchGoal(down, "1337")).toBeUndefined();
	});
});
