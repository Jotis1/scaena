import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_PATH, parseProfile } from "../profile";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import type { AlertEvent } from "../twitch/eventsub/event";
import { countGoalEvent, GOAL_EVENT, readGoal, saveGoal } from "./saved-goal";
import { readSettings, SettingsError, saveSettings } from "./settings";

const profile = parseProfile(readFileSync(PROFILE_PATH, "utf8"));
const CHANNEL = "1337";
const SUBS = { type: "subs", label: "Subs del mes", target: 300 };
const ev = (e: Partial<AlertEvent>): AlertEvent => ({
	id: "x",
	channelId: CHANNEL,
	type: "sub",
	user: "Ana",
	ts: 0,
	...e,
});
const goalEvents = async (s: ReturnType<typeof memoryStore>) =>
	(await s.xrange(keys.channel(CHANNEL, "events")))
		.filter((e) => e.fields.type === GOAL_EVENT)
		.map((e) => JSON.parse(e.fields.data ?? "{}"));

describe("meta guardada", () => {
	it("sin meta guardada no hay nada y los eventos no cuentan", async () => {
		const s = memoryStore();
		expect(await readGoal(s, CHANNEL)).toBeNull();
		expect(await countGoalEvent(s, ev({}))).toBeNull();
		expect(await s.get(keys.channel(CHANNEL, "goal"))).toBeNull();
	});

	it("guardar con «Llevas» fija la cuenta y avisa a los overlays con el valor absoluto", async () => {
		const s = memoryStore();
		const g = await saveGoal(s, CHANNEL, { goal: SUBS, current: 290 });
		expect(g).toEqual({ ...SUBS, current: 290 });
		expect(await goalEvents(s)).toEqual([{ ...SUBS, current: 290 }]);
	});

	it("cambiar el objetivo conserva la cuenta", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 290 });
		expect(await saveGoal(s, CHANNEL, { goal: { ...SUBS, target: 350 } })).toMatchObject({
			target: 350,
			current: 290,
		});
	});

	it("corregir la cuenta: 290 → 250, y sigue sumando desde ahí", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 290 });
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 250 });
		expect((await countGoalEvent(s, ev({ type: "gift", amount: 5 })))?.current).toBe(255);
	});

	it("objetivo 0: no se guarda y dice que tiene que ser mayor que cero", async () => {
		const s = memoryStore();
		const error = await saveGoal(s, CHANNEL, { goal: { ...SUBS, target: 0 } }).catch((e) => e);
		expect(error).toBeInstanceOf(SettingsError);
		expect(error.fields.target).toMatch(/mayor que cero/);
		expect(await readGoal(s, CHANNEL)).toBeNull();
		const bad = await saveGoal(s, CHANNEL, { goal: SUBS, current: -1 }).catch((e) => e);
		expect(bad.fields.current).toMatch(/entero/);
	});

	it("guardar frases no borra la meta, y guardar la meta no borra las frases", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 10 });
		await saveSettings(s, CHANNEL, profile, { alerts: { raid: "Llegan {espectadores}." } });
		expect(await readGoal(s, CHANNEL)).toEqual({ ...SUBS, current: 10 });
		await saveGoal(s, CHANNEL, { goal: { ...SUBS, label: "Subs" } });
		expect((await readSettings(s, CHANNEL)).alerts.raid).toBe("Llegan {espectadores}.");
	});

	it("solo suman los eventos del tipo de la meta, y nunca los de prueba", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 284 });
		expect(await countGoalEvent(s, ev({ type: "follow" }))).toBeNull();
		expect(await countGoalEvent(s, ev({ type: "gift", amount: 5, test: true }))).toBeNull();
		expect((await countGoalEvent(s, ev({ type: "gift", amount: 5 })))?.current).toBe(289);
		expect((await goalEvents(s)).at(-1)).toEqual({ ...SUBS, current: 289 });
	});
});
