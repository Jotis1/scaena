"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requirePageSession } from "@/lib/studio/session";
import { ConnectionError, connect, disconnect } from "@/lib/twitch/eventsub/subscriptions";
import { syncTwitchGoals } from "@/lib/twitch/goals";
import { eventSubDeps, goalSyncDeps } from "@/lib/twitch/server";

export interface ActionResult {
	error?: string;
}

const UNKNOWN =
	"Twitch no ha respondido como esperábamos. Vuelve a intentarlo en un momento; si se repite, mira el estado de Twitch.";

// Cada acción comprueba la sesión de verdad: una Server Action es una petición POST como cualquier otra.
async function run(job: (channelId: string) => Promise<unknown>): Promise<ActionResult> {
	const session = await requirePageSession();
	try {
		await job(session.channelId);
	} catch (e) {
		console.error(e);
		return { error: e instanceof ConnectionError ? e.message : UNKNOWN };
	}
	revalidatePath("/studio/connection");
	return {};
}

export async function connectEvents(): Promise<ActionResult> {
	const h = await headers();
	return run(async (id) => {
		await connect(eventSubDeps(), id);
		// La meta que ya hubiera en Twitch, sin esperar al siguiente aviso. Si falla, no estropea la conexión.
		await syncTwitchGoals(goalSyncDeps(h), id);
	});
}

export async function disconnectEvents(): Promise<ActionResult> {
	return run((id) => disconnect(eventSubDeps(), id));
}
