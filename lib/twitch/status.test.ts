import { describe, expect, it } from "vitest";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import * as F from "./eventsub/fixtures";
import { sign } from "./eventsub/signature";
import { handleWebhook } from "./eventsub/webhook";
import { type HelixDeps, TOKEN_URL } from "./helix";
import { getStatus } from "./status";

const CHANNEL = "1337";
const LIVE = {
	data: [
		{
			title: "Elden Ring sin prisa",
			game_name: "Elden Ring",
			viewer_count: 1284,
			started_at: "2026-11-04T17:00:00Z",
			type: "live",
		},
	],
};

/** Twitch falso: `streams` es lo que devuelve `/streams` en cada llamada (o un estado de error). */
function fakeTwitch(responses: (object | number)[]) {
	let calls = 0;
	const f: typeof fetch = async (input) => {
		if (String(input) === TOKEN_URL)
			return Response.json({ access_token: "t", expires_in: 5000000, token_type: "bearer" });
		calls++;
		const r = responses.shift() ?? { data: [] };
		return typeof r === "number" ? new Response(null, { status: r }) : Response.json(r);
	};
	return { f, calls: () => calls };
}

const deps = (f: typeof fetch, store = memoryStore()): HelixDeps => ({
	store,
	clientId: "c",
	clientSecret: "s",
	fetch: f,
});

describe("estado del directo", () => {
	it("en directo: título, categoría, espectadores e inicio", async () => {
		const t = fakeTwitch([LIVE]);
		expect(await getStatus(deps(t.f), CHANNEL, "jotis1")).toEqual({
			live: true,
			title: "Elden Ring sin prisa",
			category: "Elden Ring",
			viewers: 1284,
			startedAt: "2026-11-04T17:00:00Z",
		});
	});

	it("offline, sin espectadores", async () => {
		const t = fakeTwitch([{ data: [] }]);
		expect(await getStatus(deps(t.f), CHANNEL, "jotis1")).toEqual({ live: false });
	});

	it("reutiliza la caché 60 s", async () => {
		let clock = 0;
		const store = memoryStore(() => clock);
		const t = fakeTwitch([{ data: [] }, LIVE]);
		const d = deps(t.f, store);
		await getStatus(d, CHANNEL, "jotis1");
		clock += 59_000;
		expect((await getStatus(d, CHANNEL, "jotis1")).live).toBe(false);
		expect(t.calls()).toBe(1);
		clock += 2000;
		expect((await getStatus(d, CHANNEL, "jotis1")).live).toBe(true);
		expect(t.calls()).toBe(2);
	});

	it("Twitch caído: el último estado, marcado como no actualizado", async () => {
		let clock = 0;
		const store = memoryStore(() => clock);
		const t = fakeTwitch([LIVE, 503]);
		const d = deps(t.f, store);
		await getStatus(d, CHANNEL, "jotis1");
		clock += 3 * 60_000;
		expect(await getStatus(d, CHANNEL, "jotis1")).toMatchObject({
			live: true,
			viewers: 1284,
			stale: true,
		});
	});

	it("Twitch caído y nada guardado: offline", async () => {
		const t = fakeTwitch([500]);
		expect(await getStatus(deps(t.f), CHANNEL, "jotis1")).toEqual({ live: false, stale: true });
	});

	it("`stream.online` borra la caché: la siguiente consulta ya dice en directo", async () => {
		const store = memoryStore();
		const t = fakeTwitch([{ data: [] }, LIVE]);
		const d = deps(t.f, store);
		expect((await getStatus(d, CHANNEL, "jotis1")).live).toBe(false);

		const body = JSON.stringify(F.ONLINE);
		const ts = new Date().toISOString();
		const secret = "secreto-de-pruebas-1234";
		await handleWebhook(
			new Headers({
				"twitch-eventsub-message-id": "on-1",
				"twitch-eventsub-message-timestamp": ts,
				"twitch-eventsub-message-signature": sign(secret, "on-1", ts, body),
				"twitch-eventsub-message-type": "notification",
			}),
			body,
			{ store, secret },
		);
		expect(await store.get(keys.channel(CHANNEL, "status"))).toBeNull();
		expect((await getStatus(d, CHANNEL, "jotis1")).live).toBe(true);
	});
});
