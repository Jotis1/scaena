// Vídeos del canal con caché (design.md, decisión 7; specs/youtube-vods). La lista entera se guarda en Redis
// sin caducidad junto a la hora en que se pidió: dentro de la hora se sirve tal cual; pasada la hora se pide otra
// vez y, si YouTube falla o se agota la cuota, se sigue sirviendo la copia. Sin copia, lista vacía.
import { keys } from "../redis/keys";
import { fetchVideos, type Video, type YouTubeDeps } from "./client";
import { type ParsedTitle, parseTitle, type VideoKind } from "./title";

export const FRESH_MS = 60 * 60 * 1000;
export const PAGE_SIZE = 12;
/** Mientras uno pide a YouTube, los demás sirven la copia: así no salen varias consultas a la vez. */
const LOCK_SEC = 60;

interface Cached {
	videos: Video[];
	fetchedAt: number;
}

export interface VideoList {
	videos: Video[];
	/** `true` si YouTube no ha respondido y esto es la copia (o nada). */
	stale: boolean;
}

export async function getVideos(
	d: YouTubeDeps & { now?: () => number },
	channelId: string,
	handle: string,
): Promise<VideoList> {
	const now = (d.now ?? Date.now)();
	const key = keys.channel(channelId, "youtube");
	const cached = await d.store.get<Cached>(key).catch(() => null);
	if (cached && now - cached.fetchedAt < FRESH_MS) return { videos: cached.videos, stale: false };

	const lock = keys.channel(channelId, "youtube:lock");
	const mine = await d.store.set(lock, 1, { nx: true, ex: LOCK_SEC }).catch(() => true);
	if (!mine) return { videos: cached?.videos ?? [], stale: false };
	try {
		const videos = await fetchVideos(d, channelId, handle);
		await d.store.set(key, { videos, fetchedAt: now } satisfies Cached);
		return { videos, stale: false };
	} catch (error) {
		console.error(error);
		return { videos: cached?.videos ?? [], stale: true };
	} finally {
		await d.store.del(lock).catch(() => {});
	}
}

export type VideoFilter = "all" | VideoKind;
export const VIDEO_FILTERS: readonly VideoFilter[] = ["all", "live", "edited"];

export type ClassifiedVideo = Video & { parsed: ParsedTitle };

export interface VideoPage {
	items: ClassifiedVideo[];
	page: number;
	pages: number;
	total: number;
}

/** Minúsculas, sin tildes y sin espacios a los lados: «Ciudad» y «ciudad», «Pokémon» y «pokemon» son lo mismo. */
export function normalizeQuery(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

/** ¿El texto buscado está en el título o, en los directos, en el juego? (design.md, decisión 4). */
function matches(v: ClassifiedVideo, query: string): boolean {
	const fields = v.parsed.kind === "live" ? [v.parsed.title, v.parsed.game] : [v.parsed.title];
	return fields.some((f) => normalizeQuery(f).includes(query));
}

/**
 * Clasifica, filtra por tipo y por el texto buscado y, después, pagina de doce en doce. Una página fuera de rango da
 * la última.
 */
export function videoPage(videos: Video[], filter: VideoFilter, page: number, query = ""): VideoPage {
	const q = normalizeQuery(query);
	const classified = videos.map((v) => ({ ...v, parsed: parseTitle(v.title) }));
	const filtered = classified.filter(
		(v) => (filter === "all" || v.parsed.kind === filter) && (!q || matches(v, q)),
	);
	const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
	return {
		items: filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE),
		page: p,
		pages,
		total: filtered.length,
	};
}
