// Token de app de Twitch (client credentials) y cliente mínimo de Helix (design.md, decisión 3).
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";

export const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
export const HELIX_URL = "https://api.twitch.tv/helix";

/** Margen antes de que caduque: no se usa un token al que le queda menos de un minuto. */
const MARGIN_SEC = 60;

export interface HelixDeps {
	store: Store;
	clientId: string;
	clientSecret: string;
	fetch?: typeof fetch;
}

interface StoredToken {
	token: string;
}

export class HelixError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "HelixError";
	}
}

async function requestToken(d: HelixDeps): Promise<string> {
	const f = d.fetch ?? fetch;
	const res = await f(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: d.clientId,
			client_secret: d.clientSecret,
			grant_type: "client_credentials",
		}),
	});
	if (!res.ok) throw new HelixError(res.status, `Twitch no ha dado el token de app (${res.status}).`);
	const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
	const ex = Math.max(1, Math.floor(expires_in) - MARGIN_SEC);
	await d.store.set(keys.appToken(), { token: access_token } satisfies StoredToken, { ex });
	return access_token;
}

/** Token de app, reutilizado mientras dure; `refresh` fuerza uno nuevo (tras un 401). */
export async function appToken(d: HelixDeps, refresh = false): Promise<string> {
	if (!refresh) {
		const stored = await d.store.get<StoredToken>(keys.appToken());
		if (stored?.token) return stored.token;
	}
	return requestToken(d);
}

/** Petición a Helix con el token de app. Ante un 401, renueva el token una vez y la repite. */
export async function helix(d: HelixDeps, path: string, init: RequestInit = {}): Promise<Response> {
	const f = d.fetch ?? fetch;
	const send = async (token: string) =>
		f(`${HELIX_URL}${path}`, {
			...init,
			headers: {
				...(init.headers as Record<string, string> | undefined),
				"client-id": d.clientId,
				authorization: `Bearer ${token}`,
			},
		});
	let res = await send(await appToken(d));
	if (res.status === 401) res = await send(await appToken(d, true));
	return res;
}

/** Helix y JSON en un paso; lanza `HelixError` si la respuesta no es correcta. */
export async function helixJson<T>(d: HelixDeps, path: string, init?: RequestInit): Promise<T> {
	const res = await helix(d, path, init);
	if (!res.ok) throw new HelixError(res.status, `Helix ${path} respondió ${res.status}.`);
	return (await res.json()) as T;
}
