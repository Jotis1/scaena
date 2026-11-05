import { FAKE_REDIS_PORT } from "./ports";

// Acceso de los tests al Redis falso (e2e/fake-redis.ts): mismo protocolo que Upstash, sin base64.

/** Id de Twitch de jotis_1 en los tests: el de `STUDIO_ALLOWED_TWITCH_IDS` en playwright.config.ts. */
export const CHANNEL_ID = "1";

export async function redis(...command: (string | number)[]): Promise<unknown> {
	const res = await fetch(`http://localhost:${FAKE_REDIS_PORT}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(command.map(String)),
	});
	const body = (await res.json()) as { result?: unknown; error?: string };
	if (body.error) throw new Error(body.error);
	return body.result;
}

export const setJson = (key: string, value: unknown) => redis("SET", key, JSON.stringify(value));

/** Lo mínimo para que el servidor no tenga que preguntar a Twitch: el id de jotis_1 ya está en caché. */
export async function seedChannel(): Promise<void> {
	await redis("SET", "app:twitch:login:jotis_1", CHANNEL_ID);
}
