import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetsStudio } from "@/components/studio/assets/AssetsStudio";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { StudioContent } from "@/components/studio/StudioContent";
import { baseProfileOf, loadProfileWithIssues } from "@/lib/profile";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Recursos · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Recursos: paneles y banner del perfil de Twitch del canal de la sesión y el editor del contenido del que
// salen (specs/twitch-profile-assets, «Recursos del canal de la sesión»).
export default async function AssetsPage() {
	const session = await requirePageSession();
	const base = await baseProfileOf(session.login);
	if (!base) notFound();
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
