import { describe, expect, it } from "vitest";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import type { AlertEvent } from "../twitch/eventsub/event";
import { clockOffset, type GoalView, parseGoalView, pickGoal } from "./goal-pick";
import { GOAL_VIEW_EVENT, goalOverview, publishGoalView, resolveGoalView } from "./goal-view";
import { countGoalEvent, type GoalState, saveGoal, saveShow, twitchRef } from "./saved-goal";
import { endTwitchGoal, saveTwitchGoal, type TwitchGoal } from "./twitch-goal";

const CHANNEL = "1337";
const SUBS = { type: "subs", label: "Subs", target: 3 } as const;
const FOLLOWS = { type: "follows", label: "Seguidores", target: 50 } as const;
const TW: TwitchGoal = {
	id: "tw-1",
	twitchType: "follower",
	description: "Hacia los 1.000",
	current: 950,
	target: 1000,
	startedAt: 1,
};
const sub = (id = "e"): AlertEvent => ({ id, channelId: CHANNEL, type: "sub", user: "A", ts: 0 });
const label = (v: GoalView | null) => (v?.kind === "one" ? v.goal.label : v?.goals.map((g) => g.label));

async function twoGoals() {
	const s = memoryStore();
	const subs = await saveGoal(s, CHANNEL, { goal: SUBS, current: 1 });
	const follows = await saveGoal(s, CHANNEL, { goal: FOLLOWS, current: 40 });
	return { s, subs, follows };
}

// specs/obs-overlays, «Qué meta sale», «Rotación de metas» y «Meta cumplida en la rotación».
describe("qué meta sale", () => {
	it("sin metas no hay vista: los overlays usan la de su URL, y no se publica nada", async () => {
		const s = memoryStore();
		expect(await resolveGoalView(s, CHANNEL)).toBeNull();
		await publishGoalView(s, CHANNEL);
		expect(await s.xrange(keys.channel(CHANNEL, "events"))).toEqual([]);
	});

	it("por defecto, la primera de Scaena aunque haya una meta de Twitch", async () => {
		const { s } = await twoGoals();
		await saveTwitchGoal(s, CHANNEL, TW);
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Subs");
	});

	it("la elegida, sea de Scaena o de Twitch", async () => {
		const { s, follows } = await twoGoals();
		await saveShow(s, CHANNEL, { kind: "one", ref: follows.ref }, []);
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Seguidores");
		await saveTwitchGoal(s, CHANNEL, TW);
		await saveShow(s, CHANNEL, { kind: "one", ref: twitchRef(TW.id) }, [TW.id]);
		expect(await resolveGoalView(s, CHANNEL)).toMatchObject({ goal: { source: "twitch", current: 950 } });
	});

	it("una elegida que ya no está deja la de por defecto", async () => {
		const { s } = await twoGoals();
		await saveTwitchGoal(s, CHANNEL, TW);
		await saveShow(s, CHANNEL, { kind: "one", ref: twitchRef(TW.id) }, [TW.id]);
		await s.hdel(keys.channel(CHANNEL, "twitch-goals"), TW.id);
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Subs");
	});

	it("la meta que no sale también cuenta: al elegirla, sale al día", async () => {
		const { s, follows } = await twoGoals();
		await countGoalEvent(s, { ...sub(), type: "follow" });
		await countGoalEvent(s, { ...sub("f"), type: "follow" });
		await saveShow(s, CHANNEL, { kind: "one", ref: follows.ref }, []);
		expect(await resolveGoalView(s, CHANNEL)).toMatchObject({ goal: { current: 42 } });
	});

	it("rotar: las marcadas, en su orden, con el intervalo y la hora del servidor", async () => {
		const { s, subs, follows } = await twoGoals();
		const items = [
			{ ref: follows.ref, whenDone: "keep" as const },
			{ ref: subs.ref, whenDone: "keep" as const },
		];
		await saveShow(s, CHANNEL, { kind: "rotate", every: 20, items }, []);
		const v = await resolveGoalView(s, CHANNEL, 5000);
		expect(v).toMatchObject({ kind: "rotate", every: 20, serverNow: 5000 });
		expect(label(v)).toEqual(["Seguidores", "Subs"]);
	});

	it("«Sacar de la rotación»: al cumplirse deja de salir; con «Seguir» sigue", async () => {
		const { s, subs, follows } = await twoGoals();
		const items = [
			{ ref: subs.ref, whenDone: "drop" as const },
			{ ref: follows.ref, whenDone: "keep" as const },
		];
		await saveShow(s, CHANNEL, { kind: "rotate", every: 10, items }, []);
		await countGoalEvent(s, sub("1"));
		expect(label(await resolveGoalView(s, CHANNEL))).toEqual(["Subs", "Seguidores"]);
		await countGoalEvent(s, sub("2"));
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Seguidores");
		await saveShow(
			s,
			CHANNEL,
			{ kind: "rotate", every: 10, items: [{ ...items[0], whenDone: "keep" } as never, items[1]] },
			[],
		);
		expect(label(await resolveGoalView(s, CHANNEL))).toEqual(["Subs", "Seguidores"]);
	});

	it("todas cumplidas con «Sacar»: se queda la última que salió", async () => {
		const s = memoryStore();
		const follows = await saveGoal(s, CHANNEL, { goal: { ...FOLLOWS, target: 1 } });
		const subs = await saveGoal(s, CHANNEL, { goal: { ...SUBS, target: 1 } });
		const items = [
			{ ref: subs.ref, whenDone: "drop" as const },
			{ ref: follows.ref, whenDone: "drop" as const },
		];
		await saveShow(s, CHANNEL, { kind: "rotate", every: 10, items }, []);
		await countGoalEvent(s, { ...sub("f"), type: "follow" }, 1000);
		await countGoalEvent(s, sub("s"), 2000);
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Subs");
	});

	it("una meta de Twitch de la rotación que acaba sale de ella", async () => {
		const { s, subs } = await twoGoals();
		await saveTwitchGoal(s, CHANNEL, TW);
		const items = [
			{ ref: subs.ref, whenDone: "keep" as const },
			{ ref: twitchRef(TW.id), whenDone: "keep" as const },
		];
		await saveShow(s, CHANNEL, { kind: "rotate", every: 10, items }, [TW.id]);
		await endTwitchGoal(s, CHANNEL, TW.id);
		expect(label(await resolveGoalView(s, CHANNEL))).toBe("Subs");
	});

	it("la meta fija cumplida sigue saliendo, llena", async () => {
		const { s, subs } = await twoGoals();
		await saveShow(s, CHANNEL, { kind: "one", ref: subs.ref }, []);
		for (const id of ["1", "2", "3"]) await countGoalEvent(s, sub(id));
		expect(await resolveGoalView(s, CHANNEL)).toMatchObject({
			goal: { label: "Subs", current: 4, target: 3 },
		});
	});

	it("el resumen para el estudio: las de Scaena, las de Twitch, la elección y la vista", async () => {
		const { s } = await twoGoals();
		await saveTwitchGoal(s, CHANNEL, TW);
		const o = await goalOverview(s, CHANNEL);
		expect(o.goals.map((g) => g.label)).toEqual(["Subs", "Seguidores"]);
		expect(o.twitchGoals.map((g) => g.label)).toEqual(["Hacia los 1.000"]);
		expect(o.show).toBeUndefined();
		expect(o.view).toMatchObject({ kind: "one", goal: { label: "Subs" } });
	});

	it("publicar deja la vista en el flujo de eventos", async () => {
		const { s } = await twoGoals();
		await publishGoalView(s, CHANNEL);
		const [e] = await s.xrange(keys.channel(CHANNEL, "events"));
		expect(e?.fields.type).toBe(GOAL_VIEW_EVENT);
		expect(JSON.parse(e?.fields.data ?? "{}")).toMatchObject({ kind: "one", goal: { label: "Subs" } });
	});
});

// design.md del cambio goal-selector-and-rotation, decisión 4: la que toca sale del reloj.
describe("elegir la meta que toca", () => {
	const g = (label: string) => ({ label }) as GoalState;
	const view: GoalView = { kind: "rotate", every: 10, goals: [g("A"), g("B")], serverNow: 0 };

	it("cada 10 s pasa a la siguiente, y vuelve a empezar", () => {
		expect([0, 9_999, 10_000, 19_999, 20_000].map((t) => pickGoal(view, t).label)).toEqual([
			"A",
			"A",
			"B",
			"B",
			"A",
		]);
	});

	it("dos fuentes abiertas en momentos distintos enseñan la misma", () => {
		// Cada fuente recibe la vista al abrirse, con la hora del servidor de ese momento.
		const sources = [1_000, 61_000].map((opened) => {
			const v: GoalView = { ...view, serverNow: opened };
			return { v, offset: clockOffset(v, opened) };
		});
		for (const now of [125_000, 131_000, 140_500])
			expect(new Set(sources.map((x) => pickGoal(x.v, now, x.offset).label)).size, String(now)).toBe(1);
	});

	it("con el reloj local adelantado, la diferencia con el servidor lo corrige", () => {
		const fromServer: GoalView = { ...view, serverNow: 10_000 };
		const local = 5_000;
		const offset = clockOffset(fromServer, local);
		expect(offset).toBe(5_000);
		expect(pickGoal(fromServer, local, offset).label).toBe("B");
	});

	it("una sola meta: siempre esa", () => {
		expect(pickGoal({ kind: "one", goal: g("A") }, 123_456).label).toBe("A");
	});

	it("lo que llega por el SSE se comprueba", () => {
		expect(parseGoalView(view)).toEqual(view);
		expect(parseGoalView({ kind: "rotate", every: 10, goals: [], serverNow: 0 })).toBeNull();
		expect(parseGoalView({ kind: "otra" })).toBeNull();
		expect(parseGoalView("hola")).toBeNull();
	});
});
