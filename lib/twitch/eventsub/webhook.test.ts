import { beforeEach, describe, expect, it } from "vitest";
import { GOAL_VIEW_EVENT } from "../../alerts/goal-view";
import { readGoalSettings, readGoals, saveGoal, saveShow, twitchRef } from "../../alerts/saved-goal";
import { readTwitchGoals } from "../../alerts/twitch-goal";
import { keys } from "../../redis/keys";
import { memoryStore } from "../../storage/memory";
import * as F from "./fixtures";
import { sign } from "./signature";
import { handleWebhook, RETENTION_MS } from "./webhook";

const SECRET = "secreto-de-pruebas-1234";
const NOW = Date.parse("2026-11-04T17:00:00Z");

let clock = NOW;
let store = memoryStore(() => clock);
beforeEach(() => {
	clock = NOW;
	store = memoryStore(() => clock);
});

function request(body: unknown, opts: { id?: string; type?: string; secret?: string; ts?: string } = {}) {
	const text = JSON.stringify(body);
	const id = opts.id ?? crypto.randomUUID();
	const ts = opts.ts ?? new Date(clock).toISOString();
	const headers = new Headers({
		"twitch-eventsub-message-id": id,
		"twitch-eventsub-message-timestamp": ts,
		"twitch-eventsub-message-signature": sign(opts.secret ?? SECRET, id, ts, text),
		"twitch-eventsub-message-type": opts.type ?? "notification",
	});
	return handleWebhook(headers, text, { store, secret: SECRET, now: clock });
}

const events = () => store.xrange(keys.channel("1337", "events"));

describe("webhook de EventSub", () => {
	it("403 con una firma falsa, y no llega nada a los overlays", async () => {
		const r = await request(F.FOLLOW, { secret: "otro-secreto-cualquiera" });
		expect(r.status).toBe(403);
		expect(await events()).toEqual([]);
	});

	it("responde al reto con su valor en texto plano y marca la suscripción como activa", async () => {
		const r = await request(
			{ ...F.FOLLOW, challenge: "pogchamp-kappa-360noscope" },
			{ type: "webhook_callback_verification" },
		);
		expect(r.status).toBe(200);
		expect(r.headers.get("content-type")).toMatch(/^text\/plain/);
		expect(await r.text()).toBe("pogchamp-kappa-360noscope");
		expect(await store.hgetall(keys.channel("1337", "eventsub"))).toEqual({
			"channel.follow": "enabled",
		});
	});

	it("registra una revocación", async () => {
		const revoked = {
			...F.RAID,
			subscription: { ...F.RAID.subscription, status: "authorization_revoked" },
		};
		const r = await request(revoked, { type: "revocation" });
		expect(r.status).toBe(204);
		expect(await store.hgetall(keys.channel("1337", "eventsub"))).toEqual({
			"channel.raid": "authorization_revoked",
		});
	});

	it("una notificación va al stream del canal", async () => {
		expect((await request(F.RAID, { id: "raid-1" })).status).toBe(204);
		const [e] = await events();
		expect(e?.fields.type).toBe("alert");
		expect(JSON.parse(e?.fields.data ?? "{}")).toMatchObject({
			id: "raid-1",
			type: "raid",
			user: "Otro_Canal",
			amount: 1284,
		});
	});

	it("si Twitch reenvía el mismo mensaje, entra una sola vez", async () => {
		await request(F.FOLLOW, { id: "dup" });
		await request(F.FOLLOW, { id: "dup" });
		expect(await events()).toHaveLength(1);
	});

	it("la sub regalada no llega a los overlays", async () => {
		await request(F.GIFTED_SUB);
		expect(await events()).toEqual([]);
	});

	it("empezar o acabar el directo borra la caché de estado", async () => {
		await store.set(keys.channel("1337", "status"), { live: false });
		await request(F.ONLINE);
		expect(await store.get(keys.channel("1337", "status"))).toBeNull();
	});

	it("recorta lo que tiene más de 24 h", async () => {
		await request(F.FOLLOW);
		clock = NOW + RETENTION_MS + 60_000;
		await request(F.BITS);
		const types = (await events()).map((e) => JSON.parse(e.fields.data ?? "{}").type);
		expect(types).toEqual(["bits"]);
	});

	it("400 si el cuerpo no es JSON aunque la firma sea buena", async () => {
		const id = "x";
		const ts = new Date(clock).toISOString();
		const headers = new Headers({
			"twitch-eventsub-message-id": id,
			"twitch-eventsub-message-timestamp": ts,
			"twitch-eventsub-message-signature": sign(SECRET, id, ts, "no json"),
			"twitch-eventsub-message-type": "notification",
		});
		expect((await handleWebhook(headers, "no json", { store, secret: SECRET, now: clock })).status).toBe(
			400,
		);
	});

	describe("metas de Scaena", () => {
		const SUBS = { type: "subs", label: "Subs del mes", target: 300 };
		const views = async () =>
			(await events())
				.filter((e) => e.fields.type === GOAL_VIEW_EVENT)
				.map((e) => JSON.parse(e.fields.data ?? "{}"));

		it("5 subs regaladas con la meta de subs en 284 la dejan en 289 y avisan a los overlays", async () => {
			await saveGoal(store, "1337", { goal: SUBS, current: 284 });
			expect((await request(F.GIFT)).status).toBe(204);
			expect((await readGoals(store, "1337"))[0]?.current).toBe(289);
			expect((await views()).at(-1)).toMatchObject({ kind: "one", goal: { current: 289 } });
		});

		it("el mismo mensaje repetido por Twitch no vuelve a sumar", async () => {
			await saveGoal(store, "1337", { goal: SUBS, current: 284 });
			await request(F.GIFT, { id: "repetido" });
			await request(F.GIFT, { id: "repetido" });
			expect((await readGoals(store, "1337"))[0]?.current).toBe(289);
		});

		it("un follow no mueve la meta de subs ni avisa", async () => {
			await saveGoal(store, "1337", { goal: SUBS, current: 284 });
			const before = (await views()).length;
			await request(F.FOLLOW);
			expect((await readGoals(store, "1337"))[0]?.current).toBe(284);
			expect((await views()).length).toBe(before);
		});
	});

	// specs/twitch-events, «Seguimiento de la meta de Twitch»; specs/obs-overlays, «Meta de Twitch».
	describe("metas de Twitch", () => {
		const views = async () =>
			(await events())
				.filter((e) => e.fields.type === GOAL_VIEW_EVENT)
				.map((e) => JSON.parse(e.fields.data ?? "{}"));
		const SUBS = { type: "subs", label: "Meta de subs", target: 300 };
		const OTHER = { ...F.GOAL_BEGIN, event: { ...F.GOAL_BEGIN.event, id: "subs-1" } };
		const OTHER_PROGRESS = { ...F.GOAL_PROGRESS, event: { ...OTHER.event, current_amount: 11 } };

		it("sin elegirla, la meta de Twitch no sale: sigue la de Scaena", async () => {
			await saveGoal(store, "1337", { goal: SUBS, current: 12 });
			expect((await request(F.GOAL_PROGRESS)).status).toBe(204);
			expect((await views()).at(-1)).toMatchObject({
				kind: "one",
				goal: { source: "scaena", current: 12 },
			});
		});

		it("elegida, su progreso llega a los overlays con su cifra absoluta", async () => {
			await saveGoal(store, "1337", { goal: SUBS });
			await request(F.GOAL_PROGRESS);
			await saveShow(store, "1337", { kind: "one", ref: twitchRef("12345-abc-678-defgh") }, [
				"12345-abc-678-defgh",
			]);
			await request({ ...F.GOAL_PROGRESS, event: { ...F.GOAL_PROGRESS.event, current_amount: 951 } });
			expect((await views()).at(-1)).toMatchObject({
				kind: "one",
				goal: { source: "twitch", current: 951, target: 1000 },
			});
		});

		it("dos metas: el progreso de la otra no cambia la que sale, y acabar la otra tampoco", async () => {
			await saveGoal(store, "1337", { goal: SUBS });
			await request(F.GOAL_PROGRESS);
			await request(OTHER);
			const ids = ["12345-abc-678-defgh", "subs-1"];
			await saveShow(store, "1337", { kind: "one", ref: twitchRef(ids[0] as string) }, ids);
			await request(OTHER_PROGRESS);
			expect((await views()).at(-1)).toMatchObject({
				goal: { label: "Hacia los 1.000", current: 950 },
			});
			expect((await readTwitchGoals(store, "1337")).find((g) => g.id === "subs-1")?.current).toBe(11);
			await request({ ...F.GOAL_END, event: { ...OTHER.event, is_achieved: false } });
			expect((await views()).at(-1)).toMatchObject({ goal: { label: "Hacia los 1.000" } });
			expect((await readTwitchGoals(store, "1337")).map((g) => g.id)).toEqual(["12345-abc-678-defgh"]);
		});

		it("al acabar la elegida, vuelve la meta de Scaena por defecto y queda el aviso", async () => {
			await saveGoal(store, "1337", { goal: SUBS, current: 12 });
			await request(F.GOAL_PROGRESS);
			await saveShow(store, "1337", { kind: "one", ref: twitchRef("12345-abc-678-defgh") }, [
				"12345-abc-678-defgh",
			]);
			await request(F.GOAL_END);
			expect((await views()).at(-1)).toMatchObject({
				kind: "one",
				goal: { source: "scaena", current: 12 },
			});
			expect((await readGoalSettings(store, "1337")).endedTwitch).toBe("Hacia los 1.000");
		});
	});
});
