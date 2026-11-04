// De una notificación de EventSub al evento de Scaena (specs/twitch-events, «Traducción a eventos de Regula»).
// Tipos: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/
import type { AlertEvent } from "./event";

/** Suscripciones de EventSub que da de alta Scaena (design.md, decisión 3). */
export const SUBSCRIPTIONS = [
	{ type: "channel.follow", version: "2" },
	{ type: "channel.subscribe", version: "1" },
	{ type: "channel.subscription.message", version: "1" },
	{ type: "channel.subscription.gift", version: "1" },
	{ type: "channel.cheer", version: "1" },
	{ type: "channel.raid", version: "1" },
	{ type: "stream.online", version: "1" },
	{ type: "stream.offline", version: "1" },
] as const;

export type SubscriptionType = (typeof SUBSCRIPTIONS)[number]["type"];

export interface Notification {
	subscription: { type: string; condition?: Record<string, string> };
	event: Record<string, unknown>;
}

export type Normalized =
	| { kind: "alert"; event: AlertEvent }
	| { kind: "status"; channelId: string; live: boolean }
	| { kind: "ignore"; reason: string };

/** Lo que se ve en la alerta cuando Twitch no da el nombre. */
const ANONYMOUS = "Anónimo";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function tierOf(tier: unknown): 1 | 2 | 3 | undefined {
	return tier === "3000" ? 3 : tier === "2000" ? 2 : tier === "1000" || tier === "prime" ? 1 : undefined;
}

function messageOf(v: unknown): string | undefined {
	const t = str((v as { text?: unknown } | undefined)?.text ?? v);
	return t?.trim() ? t : undefined;
}

export function normalize(n: Notification, id: string, ts: number): Normalized {
	const e = n.event;
	const channelId = str(e.broadcaster_user_id);
	const base = { id, ts };
	const userOf = (anonymous: unknown, name: unknown) =>
		anonymous === true ? ANONYMOUS : (str(name) ?? ANONYMOUS);

	switch (n.subscription.type) {
		case "channel.follow":
			if (!channelId) break;
			return {
				kind: "alert",
				event: { ...base, channelId, type: "follow", user: userOf(false, e.user_name) },
			};

		case "channel.subscribe":
			// El regalo ya llega como `channel.subscription.gift`: contarlo aquí lo duplicaría en la meta.
			if (e.is_gift === true) return { kind: "ignore", reason: "sub regalada: ya cuenta el regalo" };
			if (!channelId) break;
			return {
				kind: "alert",
				event: {
					...base,
					channelId,
					type: "sub",
					user: userOf(false, e.user_name),
					tier: tierOf(e.tier),
				},
			};

		case "channel.subscription.message":
			if (!channelId) break;
			return {
				kind: "alert",
				event: {
					...base,
					channelId,
					type: "resub",
					user: userOf(false, e.user_name),
					months: num(e.cumulative_months),
					tier: tierOf(e.tier),
					message: messageOf(e.message),
				},
			};

		case "channel.subscription.gift":
			if (!channelId) break;
			return {
				kind: "alert",
				event: {
					...base,
					channelId,
					type: "gift",
					user: userOf(e.is_anonymous, e.user_name),
					amount: num(e.total) ?? 1,
					tier: tierOf(e.tier),
				},
			};

		case "channel.cheer":
			if (!channelId) break;
			return {
				kind: "alert",
				event: {
					...base,
					channelId,
					type: "bits",
					user: userOf(e.is_anonymous, e.user_name),
					amount: num(e.bits),
					message: messageOf(e.message),
				},
			};

		case "channel.raid": {
			// En un raid entrante, el canal que lo recibe va en `to_broadcaster_user_id`.
			const target = str(e.to_broadcaster_user_id);
			if (!target) break;
			return {
				kind: "alert",
				event: {
					...base,
					channelId: target,
					type: "raid",
					user: userOf(false, e.from_broadcaster_user_name),
					amount: num(e.viewers) ?? 0,
				},
			};
		}

		case "stream.online":
		case "stream.offline":
			if (!channelId) break;
			return { kind: "status", channelId, live: n.subscription.type === "stream.online" };

		default:
			return { kind: "ignore", reason: `tipo sin uso en Scaena: ${n.subscription.type}` };
	}
	return { kind: "ignore", reason: "falta el canal en el evento" };
}
