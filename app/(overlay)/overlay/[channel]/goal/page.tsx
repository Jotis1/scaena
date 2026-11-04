import { ChannelEventsProvider } from "@/components/overlay/ChannelEvents";
import { LiveGoal } from "@/components/overlay/LiveGoal";
import { GOAL_LABELS, GOAL_TYPES } from "@/lib/alerts/goal";
import { profileForOverlay } from "@/lib/overlay/channel";
import { date, int, oneOf, type SearchParams, text } from "@/lib/overlay/params";

// Meta (design.md, decisión 5). `since` lo pone el estudio al copiar la URL: el flujo reproduce desde ahí y
// recargar la fuente no pierde la cuenta. Lleva `token`.
export default async function GoalOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = profileForOverlay((await params).channel);
	const q = await searchParams;
	const type = oneOf(q, "type", GOAL_TYPES, "subs");
	const unit = text(q, "unit", "", 20);
	return (
		<ChannelEventsProvider
			channel={profile.twitch.login}
			token={text(q, "token", "", 200)}
			since={date(q, "since")?.getTime()}
		>
			<LiveGoal
				type={type}
				label={text(q, "label", GOAL_LABELS[type], 40)}
				start={int(q, "start", 0, { min: 0 })}
				goal={int(q, "goal", 100, { min: 1 })}
				unit={unit || undefined}
				width={int(q, "width", 420, { min: 200, max: 1920 })}
			/>
		</ChannelEventsProvider>
	);
}
