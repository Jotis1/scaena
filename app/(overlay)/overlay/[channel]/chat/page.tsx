import { LiveChat } from "@/components/overlay/LiveChat";
import { profileForOverlay } from "@/lib/overlay/channel";
import { bool, int, type SearchParams } from "@/lib/overlay/params";

// Overlay de chat (specs/twitch-chat). El chat es público en Twitch: no lleva token.
export default async function ChatOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = profileForOverlay((await params).channel);
	const q = await searchParams;

	return (
		<LiveChat
			channel={profile.twitch.login}
			hidden={profile.chat.hidden}
			width={int(q, "width", 420, { min: 200, max: 1920 })}
			height={int(q, "height", 520, { min: 200, max: 1080 })}
			translucent={bool(q, "translucent", false)}
			fade={bool(q, "fade", true)}
			animate={bool(q, "animate", true)}
		/>
	);
}
