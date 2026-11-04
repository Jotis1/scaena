// Verificación de las notificaciones de EventSub por webhook (specs/twitch-events, «Verificación de la firma»).
// https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#verifying-the-event-message
import { createHmac, timingSafeEqual } from "node:crypto";

/** Más antiguo que esto, se rechaza aunque la firma sea buena: evita que se reenvíe un mensaje capturado. */
export const MAX_AGE_MS = 10 * 60 * 1000;

export interface SignatureInput {
	id: string | null;
	timestamp: string | null;
	signature: string | null;
	/** El cuerpo tal cual llegó, sin parsear: cualquier cambio rompe la firma. */
	body: string;
	secret: string;
	now?: number;
}

export type SignatureResult =
	| { valid: true }
	| { valid: false; reason: "missing headers" | "signature" | "stale" };

export function sign(secret: string, id: string, timestamp: string, body: string): string {
	return `sha256=${createHmac("sha256", secret)
		.update(id + timestamp + body)
		.digest("hex")}`;
}

export function verifySignature(d: SignatureInput): SignatureResult {
	if (!d.id || !d.timestamp || !d.signature) return { valid: false, reason: "missing headers" };

	const expected = Buffer.from(sign(d.secret, d.id, d.timestamp, d.body));
	const received = Buffer.from(d.signature);
	if (expected.length !== received.length || !timingSafeEqual(expected, received))
		return { valid: false, reason: "signature" };

	const sent = Date.parse(d.timestamp);
	const now = d.now ?? Date.now();
	if (Number.isNaN(sent) || Math.abs(now - sent) > MAX_AGE_MS) return { valid: false, reason: "stale" };

	return { valid: true };
}
