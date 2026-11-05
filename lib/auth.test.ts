import { memoryAdapter } from "better-auth/adapters/memory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuth, ERROR_NOT_ALLOWED, handleAuth } from "./auth";

// Twitch simulado: el endpoint de tokens devuelve un id_token sin firmar (better-auth solo lo decodifica).
const BASE = "http://localhost:3000";
const ALLOWED = "1337";

function jwt(data: Record<string, unknown>): string {
	const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
	return `${b64({ alg: "none", typ: "JWT" })}.${b64(data)}.`;
}

let twitchProfile: Record<string, unknown>;
const realFetch = globalThis.fetch;

beforeEach(() => {
	vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input instanceof Request ? input.url : input);
		if (url.startsWith("https://id.twitch.tv/oauth2/token"))
			return Response.json({
				access_token: "user-token",
				refresh_token: "refresh",
				expires_in: 14000,
				token_type: "bearer",
				scope: ["openid"],
				id_token: jwt(twitchProfile),
			});
		return realFetch(input, init);
	});
});
afterEach(() => vi.unstubAllGlobals());

function newAuth() {
	const data: Record<string, Record<string, unknown>[]> = {
		user: [],
		session: [],
		account: [],
		verification: [],
	};
	const auth = createAuth({
		baseURL: BASE,
		secret: "x".repeat(32),
		clientId: "cid",
		clientSecret: "csecret",
		allowedIds: [ALLOWED],
		database: memoryAdapter(data),
	});
	return { auth, data };
}

const cookiesOf = (res: Response) =>
	res.headers
		.getSetCookie()
		.map((c) => c.split(";")[0])
		.join("; ");

/** Hace el viaje completo: pedir el inicio de sesión y volver de Twitch con un código. */
async function signIn(
	auth: ReturnType<typeof newAuth>["auth"],
	account: { sub: string; email: string; name: string },
) {
	twitchProfile = {
		sub: account.sub,
		email: account.email,
		email_verified: true,
		preferred_username: account.name,
	};
	const start = await auth.handler(
		new Request(`${BASE}/api/auth/sign-in/social`, {
			method: "POST",
			headers: { "content-type": "application/json", origin: BASE },
			body: JSON.stringify({
				provider: "twitch",
				callbackURL: "/studio/overlays",
				errorCallbackURL: "/studio/login",
			}),
		}),
	);
	const { url } = (await start.json()) as { url: string };
	const state = new URL(url).searchParams.get("state");
	return handleAuth(
		auth,
		new Request(`${BASE}/api/auth/callback/twitch?code=codigo&state=${state}`, {
			headers: { cookie: cookiesOf(start) },
		}),
	);
}

describe("entrada al estudio con Twitch", () => {
	it("jotis1 entra: vuelve a /studio/overlays con sesión de 30 días", async () => {
		const { auth } = newAuth();
		const res = await signIn(auth, { sub: ALLOWED, email: "jotis@ejemplo.es", name: "jotis1" });
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("/studio/overlays");
		const session = await auth.api.getSession({ headers: new Headers({ cookie: cookiesOf(res) }) });
		expect(session?.user.name).toBe("jotis1");
		const days = (new Date(session?.session.expiresAt ?? 0).getTime() - Date.now()) / 86_400_000;
		expect(Math.round(days)).toBe(30);
	});

	it("otra cuenta no obtiene sesión ni se crea en la base", async () => {
		const { auth, data } = newAuth();
		const res = await signIn(auth, { sub: "999", email: "otra@ejemplo.es", name: "otra" });
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe(
			`/studio/login?error=${ERROR_NOT_ALLOWED}&account=otra&id=999`,
		);
		expect(await auth.api.getSession({ headers: new Headers({ cookie: cookiesOf(res) }) })).toBeNull();
		expect(data.user).toHaveLength(0);
		expect(data.session).toHaveLength(0);
		expect(data.account).toHaveLength(0);
	});

	it("una cookie manipulada no da sesión", async () => {
		const { auth } = newAuth();
		const res = await signIn(auth, { sub: ALLOWED, email: "jotis@ejemplo.es", name: "jotis1" });
		const cookie = cookiesOf(res).replace(
			/(session_token=)([^;]+)/,
			(_, k, v: string) => `${k}${v.slice(0, -3)}abc`,
		);
		expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
	});

	it("«Salir» invalida la sesión", async () => {
		const { auth } = newAuth();
		const res = await signIn(auth, { sub: ALLOWED, email: "jotis@ejemplo.es", name: "jotis1" });
		const headers = new Headers({ cookie: cookiesOf(res), origin: BASE });
		await auth.api.signOut({ headers });
		expect(await auth.api.getSession({ headers })).toBeNull();
	});

	it("un state que no coincide se rechaza", async () => {
		const { auth } = newAuth();
		twitchProfile = { sub: ALLOWED, email: "jotis@ejemplo.es", preferred_username: "jotis1" };
		const res = await auth.handler(
			new Request(`${BASE}/api/auth/callback/twitch?code=codigo&state=inventado`),
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toMatch(/error=/);
		expect(await auth.api.getSession({ headers: new Headers({ cookie: cookiesOf(res) }) })).toBeNull();
	});
});
