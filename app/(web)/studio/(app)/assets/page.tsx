import type { Metadata } from "next";
import { Suspense } from "react";
import { AssetsStudio } from "@/components/studio/assets/AssetsStudio";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { StudioContent } from "@/components/studio/StudioContent";
import { loadProfileWithIssues, repoProfile } from "@/lib/profile";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Recursos · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Recursos: paneles y banner del perfil de Twitch y el editor del contenido del que salen.
export default async function AssetsPage() {
	const session = await requirePageSession();
	const base = repoProfile();
	const { profile, invalidFields } = await loadProfileWithIssues(base.twitch.login);
	return (
		<>
			<Suspense fallback={null}>
				<EventsNotice channelId={session.channelId} />
			</Suspense>
			<StudioContent>
				<AssetsStudio profile={profile} base={base} invalidFields={invalidFields} />
			</StudioContent>
		</>
	);
}
