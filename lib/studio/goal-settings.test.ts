import { describe, expect, it } from "vitest";
import { GOAL_VIEW_EVENT } from "../alerts/goal-view";
import { saveTwitchGoal } from "../alerts/twitch-goal";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { deleteGoalRequest, putGoals, readGoalPanel } from "./goal-settings";

const CHANNEL = "1337";
const OTHER = "4242";
const SUBS = { type: "subs", label: "Subs", target: 100 };
const views = async (s: ReturnType<typeof memoryStore>, ch = CHANNEL) =>
	(await s.xrange(keys.channel(ch, "events"))).filter((e) => e.fields.type === GOAL_VIEW_EVENT);
const url = (q: string) => new URL(`https://scaena.test/api/studio/settings${q}`);

// specs/obs-overlays, «Meta editable en el estudio» y «Qué meta sale».
describe("metas desde el estudio", () => {
	it("crear una meta la guarda en el canal de la sesión y avisa a sus overlays, no a los de otro", async () => {
		const s = memoryStore();
		const r = await putGoals(s, CHANNEL, { goal: SUBS, current: 5 });
		expect(r?.status).toBe(200);
		expect(r?.body).toMatchObject({ goal: { label: "Subs", current: 5 }, view: { kind: "one" } });
		expect(await views(s)).toHaveLength(1);
		expect((await readGoalPanel(s, OTHER)).goals).toEqual([]);
		expect(await views(s, OTHER)).toEqual([]);
	});

	it("un cuerpo de frases no es de las metas", async () => {
		expect(await putGoals(memoryStore(), CHANNEL, { alerts: {} })).toBeNull();
		expect(await putGoals(memoryStore(), CHANNEL, "hola")).toBeNull();
	});

	it("la sexta meta, un objetivo 0 o un `ref` que no existe: 400 con el mensaje en su campo", async () => {
		const s = memoryStore();
		for (let i = 0; i < 5; i++) await putGoals(s, CHANNEL, { goal: { ...SUBS, label: `M${i}` } });
		const sixth = await putGoals(s, CHANNEL, { goal: SUBS });
		expect(sixth).toMatchObject({ status: 400, body: { fields: { goal: "Como mucho, 5 metas." } } });
		const zero = await putGoals(s, CHANNEL, { goal: { ...SUBS, target: 0 } });
		expect(zero?.status).toBe(400);
		const ref = await putGoals(s, CHANNEL, { show: { kind: "one", ref: "twitch:no-existe" } });
		expect(ref).toMatchObject({ status: 400, body: { fields: { show: "Esa meta ya no existe." } } });
	});

	it("elegir una meta de Twitch activa la deja saliendo y avisa", async () => {
		const s = memoryStore();
		await putGoals(s, CHANNEL, { goal: SUBS });
		await saveTwitchGoal(s, CHANNEL, {
			id: "tw-1",
			twitchType: "follower",
			description: "Hacia los 1.000",
			current: 950,
			target: 1000,
			startedAt: 1,
		});
		const r = await putGoals(s, CHANNEL, { show: { kind: "one", ref: "twitch:tw-1" } });
		expect(r?.body).toMatchObject({ view: { goal: { source: "twitch", current: 950 } } });
		expect(JSON.parse((await views(s)).at(-1)?.fields.data ?? "{}")).toMatchObject({
			goal: { source: "twitch" },
		});
	});

	it("borrar: la última no; otra sí, y avisa", async () => {
		const s = memoryStore();
		const first = (await putGoals(s, CHANNEL, { goal: SUBS }))?.body as { goal: { ref: string } };
		const id = first.goal.ref.replace("scaena:", "");
		expect((await deleteGoalRequest(s, CHANNEL, url(`?goal=${id}`))).status).toBe(400);
		const second = (await putGoals(s, CHANNEL, { goal: SUBS }))?.body as { goal: { ref: string } };
		const before = (await views(s)).length;
		const r = await deleteGoalRequest(s, CHANNEL, url(`?goal=${second.goal.ref.replace("scaena:", "")}`));
		expect(r.status).toBe(200);
		expect((r.body as { goals: unknown[] }).goals).toHaveLength(1);
		expect((await views(s)).length).toBe(before + 1);
		expect((await deleteGoalRequest(s, CHANNEL, url(""))).status).toBe(400);
		expect((await deleteGoalRequest(s, CHANNEL, url("?goal=..%2Fx"))).status).toBe(400);
	});
});
