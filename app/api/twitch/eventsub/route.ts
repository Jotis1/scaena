import { env } from "@/lib/env";
import { store } from "@/lib/storage/redis";
import { handleWebhook } from "@/lib/twitch/eventsub/webhook";

// Webhook de EventSub. El cuerpo se lee crudo: la firma se calcula sobre los bytes tal cual llegaron.
export async function POST(request: Request) {
	const body = await request.text();
	return handleWebhook(request.headers, body, { store: store(), secret: env().TWITCH_EVENTSUB_SECRET });
}
