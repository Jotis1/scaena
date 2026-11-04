import { effectivePhrases, readSettings, SETTINGS_EVENT } from "@/lib/alerts/settings";
import { channelIdOf, profileOf } from "@/lib/channel";
import { handleEvents } from "@/lib/events/handler";
import { store } from "@/lib/storage/redis";

// Flujo SSE de eventos para los overlays (design.md, decisión 4). Node y sin caché; se cierra solo a los 4 min,
// antes del límite de la función, y el navegador vuelve con `Last-Event-ID`.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
	const s = store();
	const login = new URL(request.url).searchParams.get("channel") ?? "";
	return handleEvents(request, {
		store: s,
		channelId: channelIdOf,
		initial: (channelId) => async () => {
			const profile = profileOf(login);
			if (!profile) return [];
			const phrases = effectivePhrases(profile, await readSettings(s, channelId));
			return [{ event: SETTINGS_EVENT, data: JSON.stringify({ alerts: phrases }) }];
		},
	});
}
