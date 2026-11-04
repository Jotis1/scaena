import { rotateToken } from "@/lib/overlay/token";
import { store } from "@/lib/storage/redis";
import { requireApiSession } from "@/lib/studio/session";

// «Rotar token» (design.md, decisión 9): el viejo deja de valer al momento, también en los flujos abiertos.
export async function POST(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	return Response.json({ token: await rotateToken(store(), session.channelId) });
}
