import type { Metadata } from "next";
import { ProfileAssets } from "@/components/studio/ProfileAssets";
import { getMainProfile } from "@/lib/profile";
import { bannerOf, panelsOf } from "@/lib/studio/panels";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Recursos · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Recursos: paneles y banner del perfil de Twitch, desde el perfil del canal.
export default async function AssetsPage() {
	await requirePageSession();
	const profile = getMainProfile();
	return <ProfileAssets panels={panelsOf(profile)} banner={bannerOf(profile)} />;
}
