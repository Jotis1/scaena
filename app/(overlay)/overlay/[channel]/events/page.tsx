import { ChannelEventsProvider } from "@/components/overlay/ChannelEvents";
import { LiveEvents } from "@/components/overlay/LiveEvents";
import { profileForOverlay } from "@/lib/overlay/channel";
import { bool, int, type SearchParams, text } from "@/lib/overlay/params";

// Overlay de eventos recientes (specs/twitch-events, «Eventos recientes y metas»). Lleva `token`.
export default async function EventsOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = profileForOverlay((await params).channel);
	const q = await searchParams;
	return (
		<ChannelEventsProvider channel={profile.twitch.login} token={text(q, "token", "", 200)}>
			<LiveEvents
				rows={int(q, "rows", 5, { min: 1, max: 10 })}
				animate={bool(q, "animate", true)}
				width={int(q, "width", 360, { min: 200, max: 1920 })}
			/>
		</ChannelEventsProvider>
	);
}
