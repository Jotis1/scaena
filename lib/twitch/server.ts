// Dependencias reales de Twitch para el servidor: almacén del proceso y variables de entorno. Los módulos de
// `lib/twitch` las reciben por parámetro, así que los tests pasan las suyas sin tocar esto.
import { auth } from "../auth";
import { env } from "../env";
import { store } from "../storage/redis";
import type { EventSubDeps } from "./eventsub/subscriptions";
import type { GoalSyncDeps } from "./goals";
import type { HelixDeps } from "./helix";

export function helixDeps(): HelixDeps {
	const e = env();
	return { store: store(), clientId: e.TWITCH_CLIENT_ID, clientSecret: e.TWITCH_CLIENT_SECRET };
}

export function eventSubDeps(): EventSubDeps {
	const e = env();
	return {
		...helixDeps(),
		callback: new URL("/api/twitch/eventsub", e.BETTER_AUTH_URL).toString(),
		secret: e.TWITCH_EVENTSUB_SECRET,
	};
}

/** Para pedir la meta activa con el token del dueño de la sesión (better-auth lo renueva si ha caducado). */
export function goalSyncDeps(requestHeaders: Headers): GoalSyncDeps {
	return {
		store: store(),
		clientId: env().TWITCH_CLIENT_ID,
		userToken: async () => {
			const a = auth();
			const accounts = await a.api.listUserAccounts({ headers: requestHeaders });
			const twitch = accounts.find((c) => c.providerId === "twitch");
			if (!twitch) return null;
			const r = await a.api.getAccessToken({ body: { accountId: twitch.id }, headers: requestHeaders });
			return r?.accessToken ?? null;
		},
	};
}
