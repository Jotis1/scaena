import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_PATH, parseProfile } from "../profile";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import type { AlertEvent } from "../twitch/eventsub/event";
import {
	countGoalEvent,
	deleteGoal,
	dismissEnded,
	readDone,
	readGoalSettings,
	readGoals,
	saveGoal,
	saveShow,
	scaenaRef,
} from "./saved-goal";
import { readSettings, SettingsError, saveSettings } from "./settings";

const profile = parseProfile(readFileSync(PROFILE_PATH, "utf8"));
const CHANNEL = "1337";
const SUBS = { type: "subs", label: "Subs del mes", target: 300 } as const;
const FOLLOWS = { type: "follows", label: "Seguidores", target: 50 } as const;
const ev = (e: Partial<AlertEvent>): AlertEvent => ({
	id: "x",
	channelId: CHANNEL,
	type: "sub",
	user: "Ana",
	ts: 0,
	...e,
});
const idOf = (ref: string) => ref.replace("scaena:", "");

// specs/obs-overlays, «Meta editable en el estudio»; specs/twitch-events, «Eventos recientes y metas».
describe("metas de Scaena", () => {
	it("sin metas guardadas no hay nada y los eventos no cuentan", async () => {
		const s = memoryStore();
		expect(await readGoals(s, CHANNEL)).toEqual([]);
		expect(await countGoalEvent(s, ev({}))).toEqual([]);
	});

	it("crear una meta con «Llevas» fija su cuenta; sin él, empieza en 0", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS, current: 290 });
		expect(a).toMatchObject({ ...SUBS, current: 290, source: "scaena" });
		expect(a.ref).toMatch(/^scaena:[a-z0-9]{8}$/);
		const b = await saveGoal(s, CHANNEL, { goal: FOLLOWS });
		expect(b.current).toBe(0);
		expect((await readGoals(s, CHANNEL)).map((g) => g.label)).toEqual(["Subs del mes", "Seguidores"]);
	});

	it("cambiar el objetivo conserva la cuenta; corregir la cuenta la fija y sigue sumando desde ahí", async () => {
		const s = memoryStore();
		const { ref } = await saveGoal(s, CHANNEL, { goal: SUBS, current: 290 });
		const id = idOf(ref);
		expect(await saveGoal(s, CHANNEL, { goal: { id, ...SUBS, target: 350 } })).toMatchObject({
			target: 350,
			current: 290,
		});
		await saveGoal(s, CHANNEL, { goal: { id, ...SUBS }, current: 250 });
		expect((await countGoalEvent(s, ev({ type: "gift", amount: 5 })))[0]?.current).toBe(255);
		expect(await readGoals(s, CHANNEL)).toHaveLength(1);
	});

	it("objetivo 0 o una cuenta negativa no se guardan", async () => {
		const s = memoryStore();
		const error = await saveGoal(s, CHANNEL, { goal: { ...SUBS, target: 0 } }).catch((e) => e);
		expect(error).toBeInstanceOf(SettingsError);
		expect(error.fields.target).toMatch(/mayor que cero/);
		expect(await readGoals(s, CHANNEL)).toEqual([]);
		const bad = await saveGoal(s, CHANNEL, { goal: SUBS, current: -1 }).catch((e) => e);
		expect(bad.fields.current).toMatch(/entero/);
	});

	it("como mucho cinco: la sexta no se guarda", async () => {
		const s = memoryStore();
		for (let i = 0; i < 5; i++) await saveGoal(s, CHANNEL, { goal: { ...SUBS, label: `Meta ${i}` } });
		const error = await saveGoal(s, CHANNEL, { goal: SUBS }).catch((e) => e);
		expect(error.fields.goal).toBe("Como mucho, 5 metas.");
		expect(await readGoals(s, CHANNEL)).toHaveLength(5);
	});

	it("editar una meta que no existe no crea otra", async () => {
		const s = memoryStore();
		const error = await saveGoal(s, CHANNEL, { goal: { id: "zzzzzzzz", ...SUBS } }).catch((e) => e);
		expect(error.fields.goal).toMatch(/ya no existe/);
		expect(await readGoals(s, CHANNEL)).toEqual([]);
	});

	it("la última no se borra; borrar otra quita su cuenta y, si salía, vuelve la de por defecto", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS });
		const error = await deleteGoal(s, CHANNEL, idOf(a.ref)).catch((e) => e);
		expect(error.fields.goal).toMatch(/al menos una/);
		const b = await saveGoal(s, CHANNEL, { goal: FOLLOWS, current: 9 });
		await saveShow(s, CHANNEL, { kind: "one", ref: b.ref }, []);
		await deleteGoal(s, CHANNEL, idOf(b.ref));
		expect((await readGoals(s, CHANNEL)).map((g) => g.ref)).toEqual([a.ref]);
		expect((await readGoalSettings(s, CHANNEL)).show).toBeUndefined();
		expect(await s.get(keys.goalCount(CHANNEL, idOf(b.ref)))).toBeNull();
	});

	it("guardar frases no toca las metas ni la elección, y guardar una meta no borra las frases", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS, current: 10 });
		await saveShow(s, CHANNEL, { kind: "one", ref: a.ref }, []);
		await saveSettings(s, CHANNEL, profile, { alerts: { raid: "Llegan {espectadores}." } });
		expect(await readGoals(s, CHANNEL)).toMatchObject([{ ...SUBS, current: 10 }]);
		expect((await readGoalSettings(s, CHANNEL)).show).toEqual({ kind: "one", ref: a.ref });
		await saveGoal(s, CHANNEL, { goal: { id: idOf(a.ref), ...SUBS, label: "Subs" } });
		expect((await readSettings(s, CHANNEL)).alerts.raid).toBe("Llegan {espectadores}.");
	});

	it("cada evento suma a cada meta de su tipo, salga o no, y nunca los de prueba", async () => {
		const s = memoryStore();
		await saveGoal(s, CHANNEL, { goal: SUBS, current: 284 });
		await saveGoal(s, CHANNEL, { goal: FOLLOWS, current: 10 });
		await saveGoal(s, CHANNEL, {
			goal: { ...FOLLOWS, label: "Hacia los 500", target: 600 },
			current: 500,
		});
		expect(await countGoalEvent(s, ev({ type: "gift", amount: 5, test: true }))).toEqual([]);
		expect((await countGoalEvent(s, ev({ type: "follow" }))).map((g) => g.current)).toEqual([11, 501]);
		expect((await countGoalEvent(s, ev({ type: "gift", amount: 5 }))).map((g) => g.current)).toEqual([
			289,
		]);
		expect((await readGoals(s, CHANNEL)).map((g) => g.current)).toEqual([289, 11, 501]);
	});

	it("al llegar al objetivo se apunta cuándo; al bajar del objetivo se borra", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: { ...SUBS, target: 3 }, current: 2 });
		expect(await readDone(s, CHANNEL)).toEqual({});
		await countGoalEvent(s, ev({}), 1000);
		expect(await readDone(s, CHANNEL)).toEqual({ [a.ref]: 1000 });
		await countGoalEvent(s, ev({}), 2000);
		expect(await readDone(s, CHANNEL)).toEqual({ [a.ref]: 1000 });
		await saveGoal(s, CHANNEL, { goal: { id: idOf(a.ref), ...SUBS, target: 10 } });
		expect(await readDone(s, CHANNEL)).toEqual({});
	});

	it("qué meta sale: solo metas que existen, y elegir cierra el aviso de la meta de Twitch terminada", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS });
		const bad = await saveShow(s, CHANNEL, { kind: "one", ref: "scaena:zzzzzzzz" }, []).catch((e) => e);
		expect(bad.fields.show).toMatch(/ya no existe/);
		const empty = await saveShow(s, CHANNEL, { kind: "rotate", every: 10, items: [] }, []).catch(
			(e) => e,
		);
		expect(Object.values(empty.fields).join()).toMatch(/al menos una/);
		await saveShow(s, CHANNEL, { kind: "one", ref: "twitch:abc" }, ["abc"]);
		const raw = (await s.get(keys.channel(CHANNEL, "settings"))) as Record<string, unknown>;
		await s.set(keys.channel(CHANNEL, "settings"), { ...raw, endedTwitch: "Hacia los 1.000" });
		await saveShow(s, CHANNEL, { kind: "one", ref: a.ref }, []);
		expect((await readGoalSettings(s, CHANNEL)).endedTwitch).toBeUndefined();
		await s.set(keys.channel(CHANNEL, "settings"), { ...raw, endedTwitch: "Otra" });
		await dismissEnded(s, CHANNEL);
		expect((await readGoalSettings(s, CHANNEL)).endedTwitch).toBeUndefined();
	});

	it("una elección guardada que ya no vale no se lleva las metas", async () => {
		const s = memoryStore();
		const a = await saveGoal(s, CHANNEL, { goal: SUBS });
		const raw = (await s.get(keys.channel(CHANNEL, "settings"))) as Record<string, unknown>;
		await s.set(keys.channel(CHANNEL, "settings"), { ...raw, show: { kind: "otra" } });
		expect((await readGoals(s, CHANNEL)).map((g) => g.ref)).toEqual([a.ref]);
		expect((await readGoalSettings(s, CHANNEL)).show).toBeUndefined();
	});
});

// design.md del cambio goal-selector-and-rotation, decisión 3; specs/obs-overlays, «La meta de antes sigue».
describe("migración de la meta de la 0.3.0", () => {
	const legacy = async (s: ReturnType<typeof memoryStore>) => {
		await s.set(keys.channel(CHANNEL, "settings"), {
			alerts: { raid: "Llegan {espectadores}." },
			goal: SUBS,
		});
		await s.set(keys.channel(CHANNEL, "goal"), 290);
		await s.set(keys.channel(CHANNEL, "twitch-goal"), { id: "vieja" });
	};

	it("la meta de antes pasa a ser la primera, con su cuenta, y se borran las claves antiguas", async () => {
		const s = memoryStore();
		await legacy(s);
		const [g] = await readGoals(s, CHANNEL);
		expect(g).toMatchObject({ ...SUBS, current: 290, source: "scaena" });
		expect(await s.get(keys.channel(CHANNEL, "goal"))).toBeNull();
		expect(await s.get(keys.channel(CHANNEL, "twitch-goal"))).toBeNull();
		const saved = (await s.get(keys.channel(CHANNEL, "settings"))) as Record<string, unknown>;
		expect(saved.goal).toBeUndefined();
		expect(saved.alerts).toEqual({ raid: "Llegan {espectadores}." });
		// Leer otra vez no migra de nuevo.
		expect(await readGoals(s, CHANNEL)).toEqual([g]);
	});

	it("dos lecturas a la vez dejan una sola meta, con su cuenta", async () => {
		const s = memoryStore();
		await legacy(s);
		await Promise.all([readGoals(s, CHANNEL), readGoals(s, CHANNEL)]);
		const goals = await readGoals(s, CHANNEL);
		expect(goals).toHaveLength(1);
		expect(goals[0]?.current).toBe(290);
	});

	it("la meta migrada sigue contando", async () => {
		const s = memoryStore();
		await legacy(s);
		expect((await countGoalEvent(s, ev({ type: "gift", amount: 5 })))[0]?.current).toBe(295);
		expect((await readGoals(s, CHANNEL))[0]?.ref).toBe(
			scaenaRef(idOf((await readGoals(s, CHANNEL))[0]?.ref ?? "")),
		);
	});
});
