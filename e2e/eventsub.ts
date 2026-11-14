import type { APIRequestContext } from "@playwright/test";
import * as F from "../lib/twitch/eventsub/fixtures";
import type { Notification } from "../lib/twitch/eventsub/normalize";
import { sign } from "../lib/twitch/eventsub/signature";
import { CHANNEL_ID } from "./redis";

// Notificaciones de EventSub firmadas como las manda Twitch, al webhook de verdad del servidor de e2e. El secreto
// es el de `TWITCH_EVENTSUB_SECRET` en playwright.config.ts.
const SECRET = "secreto-de-pruebas-e2e";

export { F };

/** Manda `n` al webhook como si fuera del canal de los tests (jotis_1, id 1). Cada llamada, un mensaje nuevo. */
export async function twitchEvent(request: APIRequestContext, n: Notification): Promise<number> {
	const channel = { broadcaster_user_id: CHANNEL_ID };
	const body = JSON.stringify({
		subscription: { ...n.subscription, condition: channel },
		event: { ...n.event, ...channel },
	});
	const id = crypto.randomUUID();
	const ts = new Date().toISOString();
	const res = await request.post("/api/twitch/eventsub", {
		headers: {
			"content-type": "application/json",
			"twitch-eventsub-message-id": id,
			"twitch-eventsub-message-timestamp": ts,
			"twitch-eventsub-message-signature": sign(SECRET, id, ts, body),
			"twitch-eventsub-message-type": "notification",
		},
		data: body,
	});
	return res.status();
}
