// `/live` (design.md, decisión 6; specs/channel-site, «Enlace corto al directo»): al canal de Twitch si hay
// directo y, si no, a la portada con el horario a la vista. Sin caché, para que nunca lleve a un directo viejo.
import type { LiveStatus } from "./twitch/status";

export function liveRedirect(status: LiveStatus, login: string, base: string): Response {
	const to = status.live ? `https://www.twitch.tv/${login}` : new URL("/#schedule", base).toString();
	return new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store" } });
}
