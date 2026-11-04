// Cliente de YouTube Data API v3 (design.md, decisión 7). Del handle a la lista de subidas
// (`channels.list?forHandle`), de ahí los ids (`playlistItems.list`) y sus datos (`videos.list`), para quitar
// privados, ocultos, eliminados y estrenos que aún no se han emitido, y sacar la duración.
// https://developers.google.com/youtube/v3/docs
import { secondsFromIsoDuration } from "../format";
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";

export const API = "https://www.googleapis.com/youtube/v3";
/** Más que de sobra para el canal (unos 30 vídeos), y un tope por si algo se tuerce. */
const MAX_VIDEOS = 500;

export interface Video {
	id: string;
	/** Título tal cual está en YouTube; el tipo y el juego salen de `lib/youtube/title`. */
	title: string;
	publishedAt: string;
	thumbnail: string;
	/** Segundos. */
	duration: number;
}

export interface YouTubeDeps {
	store: Store;
	apiKey: string;
	fetch?: typeof fetch;
}

export class YouTubeError extends Error {
	constructor(
		public readonly status: number,
		public readonly reason: string,
	) {
		super(`YouTube respondió ${status}${reason ? ` (${reason})` : ""}.`);
		this.name = "YouTubeError";
	}
}

async function get<T>(d: YouTubeDeps, path: string, q: Record<string, string>): Promise<T> {
	const url = new URL(`${API}/${path}`);
	for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);
	url.searchParams.set("key", d.apiKey);
	const res = await (d.fetch ?? fetch)(url);
	if (!res.ok) {
		let reason = "";
		try {
			const body = (await res.json()) as { error?: { errors?: { reason?: string }[] } };
			reason = body.error?.errors?.[0]?.reason ?? "";
		} catch {}
		throw new YouTubeError(res.status, reason);
	}
	return (await res.json()) as T;
}

/** Id de la lista de subidas del canal. No cambia nunca: se guarda sin caducidad. */
export async function uploadsPlaylist(d: YouTubeDeps, channelId: string, handle: string): Promise<string> {
	const key = keys.channel(channelId, "youtube:uploads");
	const cached = await d.store.get<string>(key);
	if (cached) return String(cached);
	const r = await get<{ items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
		d,
		"channels",
		{ part: "contentDetails", forHandle: handle },
	);
	const id = r.items?.[0]?.contentDetails.relatedPlaylists.uploads;
	if (!id) throw new YouTubeError(404, `no hay canal ${handle}`);
	await d.store.set(key, id);
	return id;
}

interface PlaylistPage {
	items: { contentDetails: { videoId: string } }[];
	nextPageToken?: string;
}

interface VideoResource {
	id: string;
	snippet: {
		title: string;
		publishedAt: string;
		liveBroadcastContent?: string;
		thumbnails: Record<string, { url: string; width?: number }>;
	};
	status: { privacyStatus: string; uploadStatus?: string };
	contentDetails: { duration: string };
	liveStreamingDetails?: { actualEndTime?: string; scheduledStartTime?: string };
}

/** Solo lo que se puede ver ya: público, procesado y, si fue un estreno o un directo, ya emitido. */
export function isWatchable(v: VideoResource): boolean {
	if (v.status.privacyStatus !== "public") return false;
	if (v.status.uploadStatus && v.status.uploadStatus !== "processed") return false;
	if (v.snippet.liveBroadcastContent && v.snippet.liveBroadcastContent !== "none") return false;
	if (v.liveStreamingDetails && !v.liveStreamingDetails.actualEndTime) return false;
	return true;
}

function bestThumbnail(t: VideoResource["snippet"]["thumbnails"]): string {
	return (t.maxres ?? t.standard ?? t.high ?? t.medium ?? t.default)?.url ?? "";
}

/** Todos los vídeos vistos del canal, del más reciente al más antiguo. */
export async function fetchVideos(d: YouTubeDeps, channelId: string, handle: string): Promise<Video[]> {
	const playlistId = await uploadsPlaylist(d, channelId, handle);
	const ids: string[] = [];
	let pageToken: string | undefined;
	do {
		const page = await get<PlaylistPage>(d, "playlistItems", {
			part: "contentDetails",
			playlistId,
			maxResults: "50",
			...(pageToken ? { pageToken } : {}),
		});
		ids.push(...page.items.map((i) => i.contentDetails.videoId));
		pageToken = page.nextPageToken;
	} while (pageToken && ids.length < MAX_VIDEOS);

	const videos: Video[] = [];
	for (let i = 0; i < ids.length; i += 50) {
		// Los eliminados no vuelven en `videos.list`: se quedan fuera sin más.
		const r = await get<{ items: VideoResource[] }>(d, "videos", {
			part: "snippet,status,contentDetails,liveStreamingDetails",
			id: ids.slice(i, i + 50).join(","),
			maxResults: "50",
		});
		for (const v of r.items.filter(isWatchable))
			videos.push({
				id: v.id,
				title: v.snippet.title,
				publishedAt: v.snippet.publishedAt,
				thumbnail: bestThumbnail(v.snippet.thumbnails),
				duration: secondsFromIsoDuration(v.contentDetails.duration) ?? 0,
			});
	}
	return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
