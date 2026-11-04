// Datos de la web pública, leídos en el servidor. Nada de esto rompe la página: si Twitch, YouTube o Redis
// fallan, el estado es «offline» y la lista de vídeos la última conocida o vacía (specs/live-status y
// specs/youtube-vods, «Fallo de …»).
import { channelIdOf } from "./channel";
import { getMainProfile } from "./profile";
import { helixDeps } from "./twitch/server";
import { getStatus, type LiveStatus } from "./twitch/status";
import { youtubeDeps } from "./youtube/server";
import { getVideos, type VideoList } from "./youtube/videos";

async function mainChannelId(): Promise<string | null> {
	try {
		return await channelIdOf(getMainProfile().twitch.login);
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function siteStatus(): Promise<LiveStatus> {
	const id = await mainChannelId();
	if (!id) return { live: false, stale: true };
	return getStatus(helixDeps(), id, getMainProfile().twitch.login);
}

export async function siteVideos(): Promise<VideoList> {
	const id = await mainChannelId();
	if (!id) return { videos: [], stale: true };
	try {
		return await getVideos(youtubeDeps(), id, getMainProfile().youtube.handle);
	} catch (error) {
		console.error(error);
		return { videos: [], stale: true };
	}
}
