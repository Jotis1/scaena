import { channelIdOf } from "@/lib/channel";
import { getMainProfile } from "@/lib/profile";
import { helixDeps } from "@/lib/twitch/server";
import { getStatus } from "@/lib/twitch/status";
import { handleStatus } from "@/lib/twitch/status-handler";

// Estado del directo para la web y el overlay de estado (design.md, decisión 6).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	return handleStatus(request, {
		defaultLogin: getMainProfile().twitch.login,
		status: async (login) => {
			let id: string | null;
			try {
				id = await channelIdOf(login);
			} catch (error) {
				// Sin id no hay caché que mirar: Twitch no responde. Como manda la spec, «offline» sin romper nada.
				console.error(error);
				return { live: false, stale: true };
			}
			return id ? getStatus(helixDeps(), id, login) : null;
		},
	});
}
