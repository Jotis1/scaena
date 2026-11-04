// Respuestas de YouTube Data API v3 con la forma de su documentación (channels.list, playlistItems.list y
// videos.list), recortadas a los campos que pide Scaena. PENDIENTE: cambiarlas por respuestas capturadas del canal
// @jotis_1 cuando haya clave de la API (tarea 8.1).

export const CHANNELS = {
	kind: "youtube#channelListResponse",
	pageInfo: { totalResults: 1, resultsPerPage: 5 },
	items: [
		{
			kind: "youtube#channel",
			id: "UCjotis1aaaaaaaaaaaaaaaa",
			contentDetails: { relatedPlaylists: { likes: "", uploads: "UUjotis1aaaaaaaaaaaaaaaa" } },
		},
	],
};

const thumbs = (id: string) => ({
	default: { url: `https://i.ytimg.com/vi/${id}/default.jpg`, width: 120, height: 90 },
	medium: { url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, width: 320, height: 180 },
	high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 },
	maxres: { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, width: 1280, height: 720 },
});

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
	return {
		kind: "youtube#video",
		id,
		snippet: {
			publishedAt: over.publishedAt ?? "2026-10-29T19:30:00Z",
			channelId: "UCjotis1aaaaaaaaaaaaaaaa",
			title: over.title ?? `Vídeo ${id}`,
			thumbnails: thumbs(id),
			liveBroadcastContent: over.liveBroadcastContent ?? "none",
		},
		contentDetails: { duration: over.duration ?? "PT1H2M5S", definition: "hd" },
		status: {
			uploadStatus: "processed",
			privacyStatus: over.privacyStatus ?? "public",
			embeddable: true,
		},
		...(over.live ? { liveStreamingDetails: over.live } : {}),
	};
}

export const playlistItems = (ids: string[], nextPageToken?: string) => ({
	kind: "youtube#playlistItemListResponse",
	items: ids.map((videoId) => ({ kind: "youtube#playlistItem", contentDetails: { videoId } })),
	...(nextPageToken ? { nextPageToken } : {}),
	pageInfo: { totalResults: ids.length, resultsPerPage: 50 },
});

export const QUOTA_EXCEEDED = {
	error: {
		code: 403,
		message: "The request cannot be completed because you have exceeded your quota.",
		errors: [{ message: "…", domain: "youtube.quota", reason: "quotaExceeded" }],
	},
};
