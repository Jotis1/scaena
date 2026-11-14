// «Alertas de prueba» (specs/twitch-events, «Disparo de prueba»; design.md, decisión 9): seis eventos que llegan a
// los overlays como uno real, con la frase de su tipo, y quedan marcados como prueba. El chat no se entera.
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import type { AlertEvent, AlertType } from "../twitch/eventsub/event";
import { RETENTION_MS } from "../twitch/eventsub/webhook";

export interface TestAlert {
	type: AlertType;
	/** Texto del botón (diseño). */
	label: string;
	event: Pick<AlertEvent, "user" | "amount" | "months" | "tier" | "message">;
}

export const TEST_ALERTS: TestAlert[] = [
	{ type: "follow", label: "Follow", event: { user: "Espectador de prueba" } },
	{ type: "sub", label: "Sub nivel 1", event: { user: "Espectador de prueba", tier: 1 } },
	{
		type: "resub",
		label: "Renovación de 14 meses",
		event: {
			user: "Espectador de prueba",
			months: 14,
			tier: 1,
			message: "Catorce meses y sigo sin saltarme un cofre.",
		},
	},
	{
		type: "gift",
		label: "5 subs regaladas",
		event: { user: "Espectador de prueba", amount: 5, tier: 1 },
	},
	{
		type: "raid",
		label: "Raid de 1.284",
		event: { user: "Canal de prueba", amount: 1284 },
	},
	{ type: "bits", label: "500 bits", event: { user: "Espectador de prueba", amount: 500 } },
];

export async function sendTestAlert(store: Store, channelId: string, type: string, now = Date.now()) {
	const t = TEST_ALERTS.find((x) => x.type === type);
	if (!t) return null;
	const event: AlertEvent = {
		id: `test-${crypto.randomUUID()}`,
		channelId,
		type: t.type,
		...t.event,
		test: true,
		ts: now,
	};
	await store.xadd(
		keys.channel(channelId, "events"),
		{ type: "alert", data: JSON.stringify(event) },
		`${now - RETENTION_MS}-0`,
	);
	return event;
}
