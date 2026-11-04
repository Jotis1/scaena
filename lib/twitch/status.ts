// Estado del directo (design.md, decisión 6; specs/live-status). Helix `GET /streams` con el token de app, en
// caché 60 s y con una copia del último estado bueno sin caducidad. `stream.online` y `stream.offline` borran la
// caché (lib/twitch/eventsub/webhook.ts). Si Twitch falla, el último estado conocido marcado como no
// actualizado; si no hay ninguno, «offline». Nunca lanza: la página que lo usa no se rompe.
import { keys } from "../redis/keys";
import { type HelixDeps, helixJson } from "./helix";

export const STATUS_TTL_SEC = 60;

export type LiveStatus =
	| {
			live: true;
			title: string;
			category: string;
			viewers: number;
			/** Inicio de la emisión (ISO). El tiempo en emisión se calcula en el cliente. */
			startedAt: string;
			/** `true` si Twitch no ha respondido y esto es lo último que se supo. */
			stale?: boolean;
	  }
	| { live: false; stale?: boolean };

interface HelixStream {
	title: string;
	game_name: string;
	viewer_count: number;
	started_at: string;
	type: string;
}

export async function fetchStatus(d: HelixDeps, login: string): Promise<LiveStatus> {
	const { data } = await helixJson<{ data: HelixStream[] }>(
		d,
		`/streams?user_login=${encodeURIComponent(login)}&type=live`,
	);
	const s = data[0];
	if (!s) return { live: false };
	return {
		live: true,
		title: s.title,
		category: s.game_name,
		viewers: s.viewer_count,
		startedAt: s.started_at,
	};
}

export async function getStatus(d: HelixDeps, channelId: string, login: string): Promise<LiveStatus> {
	const cacheKey = keys.channel(channelId, "status");
	const lastKey = keys.channel(channelId, "status:last");
	try {
		const cached = await d.store.get<LiveStatus>(cacheKey);
		if (cached) return cached;
	} catch {}
	try {
		const fresh = await fetchStatus(d, login);
		await Promise.all([
			d.store.set(cacheKey, fresh, { ex: STATUS_TTL_SEC }),
			d.store.set(lastKey, fresh),
		]).catch(() => {});
		return fresh;
	} catch (error) {
		console.error(error);
		const last = await d.store.get<LiveStatus>(lastKey).catch(() => null);
		return last ? { ...last, stale: true } : { live: false, stale: true };
	}
}
