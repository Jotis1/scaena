// Respuestas de YouTube Data API v3 para los tests. Las de `responses/` son reales, capturadas del canal @jotis_1
// el 5 nov 2026 (channels.list, playlistItems.list y videos.list). Para los casos que el canal no tiene (privados,
// ocultos, estrenos pendientes), `video()` parte de un vídeo real y le cambia solo lo necesario.
import CHANNELS_RESPONSE from "./responses/channels.json";
import PLAYLIST_RESPONSE from "./responses/playlistItems.json";
import VIDEOS_RESPONSE from "./responses/videos.json";

export const CHANNELS = CHANNELS_RESPONSE;
export const REAL_PLAYLIST = PLAYLIST_RESPONSE;
export const REAL_VIDEOS = VIDEOS_RESPONSE;

type RealVideo = (typeof VIDEOS_RESPONSE.items)[number];

/** Un vídeo real (el primero de la respuesta) con otro id y lo que se cambie. */
export function video(
	id: string,
	over: {
		title?: string;
		publishedAt?: string;
		privacyStatus?: string;
		liveBroadcastContent?: string;
		duration?: string;
		live?: { actualEndTime?: string; scheduledStartTime?: string };
	} = {},
) {
	const { liveStreamingDetails: _live, ...base } = structuredClone(
		VIDEOS_RESPONSE.items[0],
	) as RealVideo & {
		liveStreamingDetails?: unknown;
	};
	const thumbs = Object.fromEntries(
		Object.entries(base.snippet.thumbnails).map(([k, t]) => [
			k,
			{ ...t, url: t.url.replace(base.id, id) },
		]),
	) as RealVideo["snippet"]["thumbnails"];
	const v: Omit<RealVideo, "liveStreamingDetails"> & { liveStreamingDetails?: typeof over.live } = {
		...base,
		id,
		snippet: {
			...base.snippet,
			title: over.title ?? `Vídeo ${id}`,
			publishedAt: over.publishedAt ?? "2026-10-29T19:30:00Z",
			liveBroadcastContent: over.liveBroadcastContent ?? "none",
			thumbnails: thumbs,
		},
		contentDetails: { ...base.contentDetails, duration: over.duration ?? "PT1H2M5S" },
		status: { ...base.status, privacyStatus: over.privacyStatus ?? "public" },
	};
	if (over.live) v.liveStreamingDetails = over.live;
	return v;
}

/** Página de `playlistItems.list` con la forma de la real. */
export const playlistItems = (ids: string[], nextPageToken?: string) => ({
	...PLAYLIST_RESPONSE,
	items: ids.map((videoId) => ({
		...PLAYLIST_RESPONSE.items[0],
		id: `item-${videoId}`,
		contentDetails: { videoId },
	})),
	nextPageToken,
	pageInfo: { totalResults: ids.length, resultsPerPage: 50 },
});

/** Cuota agotada. No se puede capturar sin agotarla: es la forma que documenta Google. */
export const QUOTA_EXCEEDED = {
	error: {
		code: 403,
		message: "The request cannot be completed because you have exceeded your quota.",
		errors: [{ message: "…", domain: "youtube.quota", reason: "quotaExceeded" }],
	},
};
