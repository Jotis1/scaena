import { liveRedirect } from "@/lib/live-redirect";
import { getMainProfile } from "@/lib/profile";
import { siteStatus } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	return liveRedirect(await siteStatus(), getMainProfile().twitch.login, request.url);
}
