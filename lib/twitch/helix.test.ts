import { describe, expect, it } from "vitest";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { appToken, type HelixDeps, HelixError, helix, helixJson, TOKEN_URL } from "./helix";

/** Twitch falso: da tokens numerados y responde a Helix con lo que se le diga. */
function fakeTwitch(helixStatuses: number[] = []) {
	let issued = 0;
	const calls: { url: string; auth?: string; clientId?: string; body?: string }[] = [];
	const f: typeof fetch = async (input, init) => {
		const url = String(input);
		const h = (init?.headers ?? {}) as Record<string, string>;
		calls.push({ url, auth: h.authorization, clientId: h["client-id"], body: init?.body?.toString() });
		if (url === TOKEN_URL) {
			issued++;
			return Response.json({
				access_token: `token-${issued}`,
				expires_in: 5000000,
				token_type: "bearer",
			});
		}
		const status = helixStatuses.shift() ?? 200;
		return status === 200 ? Response.json({ data: [] }) : new Response(null, { status });
	};
	return { f, calls, issued: () => issued };
}

const deps = (f: typeof fetch, store = memoryStore()): HelixDeps => ({
	store,
	clientId: "cid",
	clientSecret: "secreto",
	fetch: f,
});

describe("token de app", () => {
	it("pide el token con client credentials", async () => {
		const t = fakeTwitch();
		expect(await appToken(deps(t.f))).toBe("token-1");
		expect(Object.fromEntries(new URLSearchParams(t.calls[0]?.body))).toEqual({
			client_id: "cid",
			client_secret: "secreto",
			grant_type: "client_credentials",
		});
	});

	it("reutiliza el token mientras dura", async () => {
		const t = fakeTwitch();
		const d = deps(t.f);
		await appToken(d);
		await appToken(d);
		await helix(d, "/users?login=jotis_1");
		expect(t.issued()).toBe(1);
	});

	it("lo guarda con caducidad: al caducar pide otro", async () => {
		let clock = 0;
		const store = memoryStore(() => clock);
		const t = fakeTwitch();
		const d = deps(t.f, store);
		await appToken(d);
		clock = 6_000_000_000;
		expect(await appToken(d)).toBe("token-2");
		expect(await store.get(keys.appToken())).toEqual({ token: "token-2" });
	});
});

describe("helix", () => {
	it("manda client-id y el token", async () => {
		const t = fakeTwitch();
		await helix(deps(t.f), "/streams?user_login=jotis_1");
		expect(t.calls.at(-1)).toMatchObject({
			url: "https://api.twitch.tv/helix/streams?user_login=jotis_1",
			auth: "Bearer token-1",
			clientId: "cid",
		});
	});

	it("tras un 401 renueva el token una vez y repite", async () => {
		const t = fakeTwitch([401, 200]);
		const res = await helix(deps(t.f), "/streams");
		expect(res.status).toBe(200);
		expect(t.issued()).toBe(2);
		expect(t.calls.at(-1)?.auth).toBe("Bearer token-2");
	});

	it("no entra en bucle si sigue dando 401", async () => {
		const t = fakeTwitch([401, 401, 401]);
		expect((await helix(deps(t.f), "/streams")).status).toBe(401);
		expect(t.issued()).toBe(2);
	});

	it("helixJson lanza HelixError si la respuesta no es correcta", async () => {
		const t = fakeTwitch([500]);
		await expect(helixJson(deps(t.f), "/streams")).rejects.toBeInstanceOf(HelixError);
	});
});
