// Textos de `/studio/connection` (diseño: «Conexión con Twitch»). Serios, sin bromas: dicen qué pasa y qué
// hacer (design.md, decisión 12, «Texto»).
import type { SubscriptionType } from "../twitch/eventsub/normalize";
import type { SubscriptionRow } from "../twitch/eventsub/subscriptions";

export const SUBSCRIPTION_LABELS: Record<SubscriptionType, string> = {
	"channel.follow": "Nuevo seguidor",
	"channel.subscribe": "Suscripción",
	"channel.subscription.message": "Renovación",
	"channel.subscription.gift": "Subs regaladas",
	"channel.raid": "Raid",
	"channel.cheer": "Bits",
	"stream.online": "Empieza el directo",
	"stream.offline": "Acaba el directo",
};

/** Lo que deja de llegar si cae cada una. */
const CONSEQUENCE: Record<SubscriptionType, string> = {
	"channel.follow": "Los follows no llegarán a las alertas ni a los eventos",
	"channel.subscribe": "Las subs no llegarán a las alertas, los eventos ni la meta",
	"channel.subscription.message": "Las renovaciones no llegarán a las alertas ni a los eventos",
	"channel.subscription.gift": "Las subs regaladas no llegarán a las alertas, los eventos ni la meta",
	"channel.raid": "Las raids no llegarán a las alertas ni a los eventos",
	"channel.cheer": "Los bits no llegarán a las alertas, los eventos ni la meta",
	"stream.online": "La web tardará hasta un minuto más en ver que empieza el directo",
	"stream.offline": "La web tardará hasta un minuto más en ver que acaba el directo",
};

/** Motivos de Twitch (`status` de la suscripción), en castellano. */
const REASONS: Record<string, string> = {
	authorization_revoked: "se ha retirado la autorización de la app",
	user_removed: "la cuenta ya no existe",
	notification_failures_exceeded: "demasiados fallos de entrega",
	version_removed: "Twitch ha retirado esa versión del evento",
	moderator_removed: "la cuenta ya no es moderadora del canal",
	webhook_callback_verification_failed: "no se pudo verificar la URL del webhook",
};

export function reasonText(reason: string | undefined): string {
	return (reason && REASONS[reason]) || "Twitch no ha dado el motivo";
}

export type ConnectionView = "none" | "connected" | "revoked";

export function connectionView(rows: SubscriptionRow[]): ConnectionView {
	if (rows.some((r) => r.state === "revoked")) return "revoked";
	if (rows.every((r) => r.state === "missing")) return "none";
	return "connected";
}

/** Aviso de revocación: título y descripción, para una o varias. */
export function revokedNotice(rows: SubscriptionRow[]): { title: string; description: string } | null {
	const revoked = rows.filter((r) => r.state === "revoked");
	const [first] = revoked;
	if (!first) return null;
	if (revoked.length === 1)
		return {
			title: "Twitch ha revocado una suscripción",
			description: `${CONSEQUENCE[first.type]} hasta que la reactives. Motivo que da Twitch: ${reasonText(first.reason)}.`,
		};
	return {
		title: `Twitch ha revocado ${revoked.length} suscripciones`,
		description: `${revoked.map((r) => SUBSCRIPTION_LABELS[r.type]).join(", ")}: no llegarán a los overlays hasta que las reactives. Motivo que da Twitch: ${reasonText(first.reason)}.`,
	};
}

export function activeCount(rows: SubscriptionRow[]): string {
	return `${rows.filter((r) => r.state === "enabled").length} de ${rows.length} activas`;
}
