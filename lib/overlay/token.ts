// Token de overlay de cada canal (design.md, decisiones 9 y 14). Va en la URL de OBS de las piezas con eventos;
// se guarda en Redis por canal, se genera la primera vez que el estudio lo pide y se rota desde el estudio.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";

/** Aviso que se mete en el stream de eventos al rotar: los flujos abiertos lo ven y se cierran. */
export const TOKEN_ROTATED = "token";

const newToken = () => randomBytes(24).toString("base64url");

/** El token del canal; si no hay, lo crea (sin pisar uno que otra petición acabe de crear). */
export async function getOrCreateToken(store: Store, channelId: string): Promise<string> {
	const key = keys.channel(channelId, "token");
	const current = await store.get<string>(key);
	if (current) return String(current);
	await store.set(key, newToken(), { nx: true });
	return String(await store.get<string>(key));
}

/** Token nuevo; el viejo deja de valer al momento, también en los flujos SSE ya abiertos. */
export async function rotateToken(store: Store, channelId: string): Promise<string> {
	const token = newToken();
	await store.set(keys.channel(channelId, "token"), token);
	await store.xadd(keys.channel(channelId, "events"), { type: TOKEN_ROTATED, data: "{}" });
	return token;
}

/** Comparación en tiempo constante: no deja adivinar el token por lo que tarda en responder. */
export function sameToken(given: string | null | undefined, expected: string | null | undefined): boolean {
	if (!given || !expected) return false;
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

export async function isValidToken(store: Store, channelId: string, given: string | null): Promise<boolean> {
	const expected = await store.get<string>(keys.channel(channelId, "token"));
	return sameToken(given, expected === null ? null : String(expected));
}
