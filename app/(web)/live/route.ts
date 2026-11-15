import { liveRedirect } from "@/lib/live-redirect";
import { repoProfile } from "@/lib/profile";
import { siteStatus } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	return liveRedirect(await siteStatus(), repoProfile().twitch.login, request.url);
}
