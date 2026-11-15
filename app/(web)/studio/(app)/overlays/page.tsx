import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { Suspense } from "react";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { OverlaySources } from "@/components/studio/OverlaySources";
import { StudioContent } from "@/components/studio/StudioContent";
import { readGoal } from "@/lib/alerts/saved-goal";
import { effectivePhrases, readSettings } from "@/lib/alerts/settings";
import { readTwitchGoal, twitchGoalState } from "@/lib/alerts/twitch-goal";
import { env } from "@/lib/env";
import { canvasOf } from "@/lib/overlay/canvas";
import { getOrCreateToken } from "@/lib/overlay/token";
import { loadMainProfile } from "@/lib/profile";
import { sceneFooter } from "@/lib/profile/schedule";
import { store } from "@/lib/storage/redis";
import { sourceOf } from "@/lib/studio/overlay-sources";
import { requirePageSession } from "@/lib/studio/session";
import { syncTwitchGoal } from "@/lib/twitch/goals";
import { goalSyncDeps } from "@/lib/twitch/server";

export const metadata: Metadata = { title: "Overlays · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Overlays. La sesión se comprueba de verdad aquí, no solo en `proxy.ts` (specs/obs-overlays).
export default async function OverlaysPage({
	searchParams,
}: {
	searchParams: Promise<{ source?: string; tab?: string; canvas?: string }>;
}) {
	const session = await requirePageSession();
	const q = await searchParams;
	const profile = await loadMainProfile();
	const s = store();
	const [token, settings, goal, twitchGoal] = await Promise.all([
		getOrCreateToken(s, session.channelId),
		readSettings(s, session.channelId),
		readGoal(s, session.channelId),
		readTwitchGoal(s, session.channelId),
	]);
	// La meta de Twitch se pregunta después de contestar: la página no espera a Twitch (design.md, decisión 6).
	const h = await headers();
	after(() => syncTwitchGoal(goalSyncDeps(h), session.channelId));
	return (
		<>
			{/* Sin esperar a Twitch: el aviso llega cuando llegue. */}
			<Suspense fallback={null}>
				<EventsNotice channelId={session.channelId} />
			</Suspense>
			<StudioContent>
				<OverlaySources
					origin={new URL(env().BETTER_AUTH_URL).origin}
					channel={profile.twitch.login}
					token={token}
					cameraName={profile.camera.name}
					footer={sceneFooter(profile.schedule)}
					scenes={profile.scenes}
					phrases={effectivePhrases(profile, settings)}
					goal={goal}
					twitchGoal={twitchGoal ? twitchGoalState(twitchGoal) : null}
					source={sourceOf(q)}
					canvas={canvasOf(q).id}
				/>
			</StudioContent>
		</>
	);
}
