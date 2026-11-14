import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { OverlaySources } from "@/components/studio/OverlaySources";
import { readGoal } from "@/lib/alerts/saved-goal";
import { effectivePhrases, readSettings } from "@/lib/alerts/settings";
import { env } from "@/lib/env";
import { canvasOf } from "@/lib/overlay/canvas";
import { getOrCreateToken } from "@/lib/overlay/token";
import { getMainProfile } from "@/lib/profile";
import { sceneFooter } from "@/lib/profile/schedule";
import { store } from "@/lib/storage/redis";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Overlays · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Overlays. La sesión se comprueba de verdad aquí, no solo en `proxy.ts` (specs/obs-overlays).
export default async function OverlaysPage({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string; canvas?: string }>;
}) {
	const session = await requirePageSession();
	const q = await searchParams;
	const { tab } = q;
	const profile = getMainProfile();
	const s = store();
	const [token, settings, goal] = await Promise.all([
		getOrCreateToken(s, session.channelId),
		readSettings(s, session.channelId),
		readGoal(s, session.channelId),
	]);
	return (
		<>
			{/* Sin esperar a Twitch: el aviso llega cuando llegue. */}
			<Suspense fallback={null}>
				<EventsNotice channelId={session.channelId} />
			</Suspense>
			<OverlaySources
				origin={new URL(env().BETTER_AUTH_URL).origin}
				channel={profile.twitch.login}
				token={token}
				cameraName={profile.camera.name}
				footer={sceneFooter(profile.schedule)}
				scenes={profile.scenes}
				phrases={effectivePhrases(profile, settings)}
				goal={goal}
				tab={tab === "scenes" ? "scenes" : "pieces"}
				canvas={canvasOf(q).id}
			/>
		</>
	);
}
