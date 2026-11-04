import { LiveStatusPill } from "@/components/overlay/LiveStatusPill";
import { profileForOverlay } from "@/lib/overlay/channel";
import { bool, type SearchParams } from "@/lib/overlay/params";

// Overlay de estado (specs/live-status). Público en Twitch: no lleva token. Espectadores con `viewers=1`.
export default async function StatusOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = profileForOverlay((await params).channel);
	const q = await searchParams;
	return <LiveStatusPill channel={profile.twitch.login} viewers={bool(q, "viewers", false)} />;
}
