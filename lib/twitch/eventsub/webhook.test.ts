import { beforeEach, describe, expect, it } from "vitest";
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
});
