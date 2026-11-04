// Webhook de EventSub (specs/twitch-events; design.md, decisión 3). Separado de la ruta para probarlo con el
// almacén en memoria.
import { keys } from "../../redis/keys";
import type { Store } from "../../storage/types";
import { type Notification, normalize } from "./normalize";
import { verifySignature } from "./signature";

/** Lo que dura la marca de "ya visto": Twitch reintenta como mucho durante unos minutos. */
const DUPLICATE_TTL_SEC = 600;
/** Los eventos se guardan 24 h: da para reconectar y para reconstruir la meta (`since`). */
export const RETENTION_MS = 24 * 60 * 60 * 1000;

export interface WebhookContext {
	store: Store;
	secret: string;
	now?: number;
}

const reply = (status: number, body = "", type = "text/plain; charset=utf-8") =>
	new Response(body || null, { status, headers: body ? { "content-type": type } : {} });

/** Canal de una suscripción: el que emite o, en un raid, el que lo recibe. */
function channelOf(condition: Record<string, string> | undefined): string | undefined {
	return condition?.broadcaster_user_id ?? condition?.to_broadcaster_user_id;
}

export async function handleWebhook(headers: Headers, body: string, ctx: WebhookContext): Promise<Response> {
	const now = ctx.now ?? Date.now();
	const id = headers.get("twitch-eventsub-message-id");
	const signature = verifySignature({
		id,
		timestamp: headers.get("twitch-eventsub-message-timestamp"),
		signature: headers.get("twitch-eventsub-message-signature"),
		body,
		secret: ctx.secret,
		now,
	});
	if (!signature.valid) return reply(403, "Firma no válida.");

	let data: Notification & { challenge?: string; subscription: { status?: string } };
	try {
		data = JSON.parse(body);
	} catch {
		return reply(400, "El cuerpo no es JSON.");
	}
	const messageType = headers.get("twitch-eventsub-message-type");
	const channel = channelOf(data.subscription?.condition);

	if (messageType === "webhook_callback_verification") {
		if (channel)
			await ctx.store.hset(keys.channel(channel, "eventsub"), { [data.subscription.type]: "enabled" });
		return reply(200, data.challenge ?? "");
	}

	if (messageType === "revocation") {
		if (channel)
			await ctx.store.hset(keys.channel(channel, "eventsub"), {
				[data.subscription.type]: data.subscription.status ?? "revoked",
			});
		return reply(204);
	}

	if (messageType !== "notification") return reply(204);

	// Twitch reintenta si no contestamos a tiempo: el mismo id solo cuenta una vez.
	const first = await ctx.store.set(keys.eventsubSeen(id as string), 1, {
		nx: true,
		ex: DUPLICATE_TTL_SEC,
	});
	if (!first) return reply(204);

	const r = normalize(data, id as string, now);
	if (r.kind === "alert") {
		await ctx.store.xadd(
			keys.channel(r.event.channelId, "events"),
			{ type: "alert", data: JSON.stringify(r.event) },
			`${now - RETENTION_MS}-0`,
		);
	} else if (r.kind === "status") {
		// Empieza o acaba el directo: la próxima consulta del estado va a Twitch (specs/live-status).
		await ctx.store.del(keys.channel(r.channelId, "status"));
	}
	return reply(204);
}
