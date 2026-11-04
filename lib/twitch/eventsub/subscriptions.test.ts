import { describe, expect, it } from "vitest";
import { keys } from "../../redis/keys";
import { memoryStore } from "../../storage/memory";
import { TOKEN_URL } from "../helix";
import { SUBSCRIPTIONS } from "./normalize";
import {
	ConnectionError,
	conditionFor,
	connect,
	connectionStatus,
	disconnect,
	type EventSubDeps,
} from "./subscriptions";

const CHANNEL = "1337";
const CALLBACK = "https://scaena.jotis.me/api/twitch/eventsub";

interface Sub {
	id: string;
	type: string;
	version: string;
	status: string;
	condition: Record<string, string>;
	transport: { method: string; callback: string };
	created_at: string;
}

/** Helix falso con las suscripciones en memoria. `failCreate` responde ese estado al crear. */
function fakeHelix(initial: Sub[] = [], failCreate?: { status: number; message: string }) {
	const subs = [...initial];
	let n = 0;
	const created: string[] = [];
	const f: typeof fetch = async (input, init) => {
		const url = new URL(String(input));
		if (String(input) === TOKEN_URL)
			return Response.json({ access_token: "t", expires_in: 5000000, token_type: "bearer" });
		const method = init?.method ?? "GET";
		if (method === "GET") {
			// Dos páginas, para probar el cursor.
			const after = Number(url.searchParams.get("after") ?? 0);
			const page = subs.slice(after, after + 5);
			const next = after + 5 < subs.length ? String(after + 5) : undefined;
			return Response.json({ data: page, pagination: next ? { cursor: next } : {} });
		}
		if (method === "DELETE") {
			const id = url.searchParams.get("id");
			const i = subs.findIndex((s) => s.id === id);
			if (i < 0) return new Response(null, { status: 404 });
			subs.splice(i, 1);
			return new Response(null, { status: 204 });
		}
		if (failCreate) return Response.json({ message: failCreate.message }, { status: failCreate.status });
		const body = JSON.parse(String(init?.body));
		const sub: Sub = {
			id: `s${++n}`,
			type: body.type,
			version: body.version,
			status: "webhook_callback_verification_pending",
			condition: body.condition,
			transport: { method: "webhook", callback: body.transport.callback },
			created_at: "2026-11-04T17:00:00Z",
		};
		subs.push(sub);
		created.push(body.type);
		return Response.json({ data: [sub] }, { status: 202 });
	};
	return { f, subs, created };
}

const deps = (f: typeof fetch, store = memoryStore()): EventSubDeps => ({
	store,
	clientId: "cid",
	clientSecret: "cs",
	fetch: f,
	callback: CALLBACK,
	secret: "secreto-de-pruebas",
});

const enabled = (type: string, id = type, status = "enabled"): Sub => ({
	id,
	type,
	version: "1",
	status,
	condition: conditionFor(type as never, CHANNEL),
	transport: { method: "webhook", callback: CALLBACK },
	created_at: `2026-10-${10 + SUBSCRIPTIONS.findIndex((s) => s.type === type)}T10:00:00Z`,
});

describe("conexión de EventSub", () => {
	it("la primera vez da de alta las ocho, con la condición de cada tipo", async () => {
		const h = fakeHelix();
		expect(await connect(deps(h.f), CHANNEL)).toBe(8);
		expect(h.created).toEqual(SUBSCRIPTIONS.map((s) => s.type));
		expect(h.subs.find((s) => s.type === "channel.raid")?.condition).toEqual({
			to_broadcaster_user_id: CHANNEL,
		});
		expect(h.subs.find((s) => s.type === "channel.follow")?.condition).toEqual({
			broadcaster_user_id: CHANNEL,
			moderator_user_id: CHANNEL,
		});
	});

	it("repetir la conexión no crea suscripciones repetidas", async () => {
		const h = fakeHelix();
		const d = deps(h.f);
		await connect(d, CHANNEL);
		expect(await connect(d, CHANNEL)).toBe(0);
		expect(h.subs).toHaveLength(8);
	});

	it("solo crea las que faltan y rehace las revocadas", async () => {
		const h = fakeHelix([
			enabled("channel.follow"),
			enabled("channel.cheer"),
			enabled("channel.raid", "viejo", "notification_failures_exceeded"),
		]);
		expect(await connect(deps(h.f), CHANNEL)).toBe(6);
		expect(h.subs.filter((s) => s.type === "channel.raid").map((s) => s.id)).not.toContain("viejo");
		expect(h.subs).toHaveLength(8);
	});

	it("no cuenta las de otro canal ni las de otro webhook", async () => {
		const other = { ...enabled("channel.follow"), condition: { broadcaster_user_id: "42" } };
		const elsewhere = {
			...enabled("channel.cheer"),
			transport: { method: "webhook", callback: "https://otra.app/hook" },
		};
		const h = fakeHelix([other, elsewhere]);
		expect(await connect(deps(h.f), CHANNEL)).toBe(8);
	});

	it("el estado junta Twitch y las revocaciones guardadas", async () => {
		const store = memoryStore();
		const h = fakeHelix([
			enabled("channel.follow"),
			enabled("channel.subscribe"),
			enabled("stream.online", "p", "webhook_callback_verification_pending"),
		]);
		await store.hset(keys.channel(CHANNEL, "eventsub"), { "channel.raid": "authorization_revoked" });
		const { rows, connectedAt } = await connectionStatus(deps(h.f, store), CHANNEL);
		const byType = Object.fromEntries(rows.map((r) => [r.type, r.state]));
		expect(byType).toMatchObject({
			"channel.follow": "enabled",
			"channel.subscribe": "enabled",
			"stream.online": "pending",
			"channel.raid": "revoked",
			"channel.cheer": "missing",
		});
		expect(rows.find((r) => r.type === "channel.raid")?.reason).toBe("authorization_revoked");
		expect(connectedAt).toBe("2026-10-10T10:00:00Z");
	});

	it("desconectar borra las del canal y las revocaciones guardadas", async () => {
		const store = memoryStore();
		const h = fakeHelix();
		const d = deps(h.f, store);
		await connect(d, CHANNEL);
		await store.hset(keys.channel(CHANNEL, "eventsub"), { "channel.raid": "revoked" });
		expect(await disconnect(d, CHANNEL)).toBe(8);
		expect(h.subs).toHaveLength(0);
		expect(await store.hgetall(keys.channel(CHANNEL, "eventsub"))).toEqual({});
	});

	it("si falta un permiso, el error dice cómo arreglarlo", async () => {
		const h = fakeHelix([], { status: 403, message: "subscription missing proper authorization" });
		const error = await connect(deps(h.f), CHANNEL).catch((e) => e);
		expect(error).toBeInstanceOf(ConnectionError);
		expect(error.message).toMatch(/vuelve a entrar con Twitch/);
	});

	it("sin https, el error habla de la URL pública", async () => {
		const h = fakeHelix([], { status: 400, message: "invalid transport callback: must use https" });
		await expect(connect(deps(h.f), CHANNEL)).rejects.toThrow(/https en el puerto 443/);
	});
});
