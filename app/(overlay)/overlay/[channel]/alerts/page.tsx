import { ChannelEventsProvider } from "@/components/overlay/ChannelEvents";
import { LiveAlerts } from "@/components/overlay/LiveAlerts";
import { profileForOverlay } from "@/lib/overlay/channel";
import { bool, int, type SearchParams, text } from "@/lib/overlay/params";

// Overlay de alertas (specs/twitch-events, «Cola de alertas»). Con eventos, así que lleva `token`: sin él o con
// uno que no vale, la página queda transparente.
export default async function AlertsOverlay({
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
			<LiveAlerts
				message={bool(q, "message", true)}
				durationMs={int(q, "duration", 7, { min: 3, max: 30 }) * 1000}
			/>
		</ChannelEventsProvider>
	);
}
