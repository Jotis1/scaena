// Alta, estado y baja de las suscripciones de EventSub de un canal (specs/twitch-events, «Conexión del canal»;
// design.md, decisión 3). Se dan de alta con el token de app, una vez que el dueño ha autorizado la app al
// entrar en el estudio. El alta mira antes `GET /eventsub/subscriptions` para no duplicar nada.
// https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription
import { keys } from "../../redis/keys";
import { type HelixDeps, HelixError, helix, helixJson } from "../helix";
import { SUBSCRIPTIONS, type SubscriptionType } from "./normalize";

/** Estado de una suscripción tal como se enseña en `/studio/connection`. */
export type SubscriptionState = "enabled" | "pending" | "revoked" | "missing";

export interface SubscriptionRow {
	type: SubscriptionType;
	state: SubscriptionState;
	/** Motivo que da Twitch cuando no está activa (`authorization_revoked`, `notification_failures_exceeded`…). */
	reason?: string;
	/** Id en Twitch, si existe. */
	id?: string;
	createdAt?: string;
}

export interface ConnectionStatus {
	rows: SubscriptionRow[];
	/** La más antigua de las activas: «conectado el …». */
	connectedAt?: string;
}

export interface EventSubDeps extends HelixDeps {
	/** URL pública del webhook: `<BETTER_AUTH_URL>/api/twitch/eventsub`. */
	callback: string;
	secret: string;
}

interface HelixSubscription {
	id: string;
	type: string;
	version: string;
	status: string;
	condition: Record<string, string>;
	transport: { method: string; callback?: string };
	created_at: string;
}

/** Error con un texto para quien usa el estudio: qué pasa y cómo arreglarlo. */
export class ConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConnectionError";
	}
}

/** Condición de cada tipo: el raid entrante va por el canal que lo recibe; el follow v2 pide moderador. */
export function conditionFor(type: SubscriptionType, channelId: string): Record<string, string> {
	if (type === "channel.raid") return { to_broadcaster_user_id: channelId };
	if (type === "channel.follow") return { broadcaster_user_id: channelId, moderator_user_id: channelId };
	return { broadcaster_user_id: channelId };
}

const belongsTo = (s: HelixSubscription, channelId: string) =>
	s.condition.broadcaster_user_id === channelId || s.condition.to_broadcaster_user_id === channelId;

/** Todas las suscripciones de la app que tocan al canal y van a nuestro webhook. */
async function listOwn(d: EventSubDeps, channelId: string): Promise<HelixSubscription[]> {
	const all: HelixSubscription[] = [];
	let cursor: string | undefined;
	do {
		const q = new URLSearchParams({ user_id: channelId });
		if (cursor) q.set("after", cursor);
		const page = await helixJson<{ data: HelixSubscription[]; pagination?: { cursor?: string } }>(
			d,
			`/eventsub/subscriptions?${q}`,
		);
		all.push(...page.data);
		cursor = page.pagination?.cursor || undefined;
	} while (cursor);
	return all.filter(
		(s) =>
			s.transport.method === "webhook" &&
			s.transport.callback === d.callback &&
			belongsTo(s, channelId),
	);
}

function stateOf(status: string): SubscriptionState {
	if (status === "enabled") return "enabled";
	if (status === "webhook_callback_verification_pending") return "pending";
	return "revoked";
}

/** Estado de las ocho suscripciones, de Twitch y, si Twitch ya la ha borrado, de la revocación guardada. */
export async function connectionStatus(d: EventSubDeps, channelId: string): Promise<ConnectionStatus> {
	const [own, revocations] = await Promise.all([
		listOwn(d, channelId),
		d.store.hgetall(keys.channel(channelId, "eventsub")),
	]);
	const rows = SUBSCRIPTIONS.map(({ type }): SubscriptionRow => {
		const s = own.find((x) => x.type === type);
		if (s) {
			const state = stateOf(s.status);
			return {
				type,
				state,
				id: s.id,
				createdAt: s.created_at,
				reason: state === "revoked" ? s.status : undefined,
			};
		}
		const stored = revocations[type];
		return stored && stored !== "enabled"
			? { type, state: "revoked", reason: stored }
			: { type, state: "missing" };
	});
	const dates = rows
		.filter((r) => r.state === "enabled" && r.createdAt)
		.map((r) => r.createdAt as string)
		.sort();
	return { rows, connectedAt: dates[0] };
}

/** Lo que Twitch contesta al crear, en un texto que dice qué hacer. */
async function explain(res: Response, type: string): Promise<ConnectionError> {
	let message = "";
	try {
		message = ((await res.json()) as { message?: string }).message ?? "";
	} catch {}
	if (res.status === 403)
		return new ConnectionError(
			`Twitch no deja dar de alta «${type}»: falta un permiso de la cuenta. Sal del estudio y vuelve a entrar con Twitch para concederlo.`,
		);
	if (res.status === 400 && /https|callback/i.test(message))
		return new ConnectionError(
			"Twitch solo manda eventos a una URL pública con https en el puerto 443. Revisa BETTER_AUTH_URL: en local hace falta un túnel, como el de la CLI de Twitch.",
		);
	if (res.status === 429)
		return new ConnectionError(
			"Twitch está limitando las peticiones. Espera un minuto y vuelve a intentarlo.",
		);
	return new ConnectionError(
		`Twitch ha rechazado «${type}» (${res.status}${message ? `: ${message}` : ""}). Vuelve a intentarlo y, si se repite, mira el estado de Twitch.`,
	);
}

async function remove(d: EventSubDeps, id: string): Promise<void> {
	const res = await helix(d, `/eventsub/subscriptions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
	// 404: ya no existía. Para lo que queremos, es lo mismo.
	if (!res.ok && res.status !== 404) throw new HelixError(res.status, `Twitch no ha borrado ${id}.`);
}

/**
 * Da de alta lo que falta. Las activas o pendientes se dejan como están (no se duplica nada); las revocadas
 * se borran y se crean de nuevo («Reactivar»). Devuelve cuántas ha creado.
 */
export async function connect(d: EventSubDeps, channelId: string): Promise<number> {
	const own = await listOwn(d, channelId);
	// Las revocaciones guardadas dejan de contar; el reto de cada alta vuelve a marcarlas como activas.
	await d.store.del(keys.channel(channelId, "eventsub"));
	let created = 0;
	for (const { type, version } of SUBSCRIPTIONS) {
		const existing = own.filter((s) => s.type === type);
		if (existing.some((s) => stateOf(s.status) !== "revoked")) continue;
		for (const s of existing) await remove(d, s.id);
		const res = await helix(d, "/eventsub/subscriptions", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				type,
				version,
				condition: conditionFor(type, channelId),
				transport: { method: "webhook", callback: d.callback, secret: d.secret },
			}),
		});
		// 409: Twitch ya la tiene (por ejemplo, otra pestaña la acaba de crear). No es un error.
		if (res.status === 409) continue;
		if (!res.ok) throw await explain(res, type);
		created++;
	}
	return created;
}

/** Borra todas las suscripciones del canal en nuestro webhook («Desconectar»). */
export async function disconnect(d: EventSubDeps, channelId: string): Promise<number> {
	const own = await listOwn(d, channelId);
	for (const s of own) await remove(d, s.id);
	await d.store.del(keys.channel(channelId, "eventsub"));
	return own.length;
}
