import { CamFrame } from "@jotis-me/react";
import type { Profile } from "@/lib/profile";
import { ChannelEventsProvider } from "../ChannelEvents";
import { LiveAlerts } from "../LiveAlerts";
import { LiveChat } from "../LiveChat";
import { LiveEvents } from "../LiveEvents";
import { LiveGoal } from "../LiveGoal";
import { LiveStatusPill } from "../LiveStatusPill";
import { CAMERA_HOLE, ChattingLayout } from "./layouts";
import type { SceneOptions } from "./params";

/** Escena de Just Chatting en vivo (design.md, decisión 15). La cámara la pone OBS por el hueco del fondo. */
export function ChattingScene({ profile, o }: { profile: Profile; o: SceneOptions }) {
	const channel = profile.twitch.login;
	return (
		<ChannelEventsProvider channel={channel} token={o.token} since={o.since}>
			<ChattingLayout
				status={<LiveStatusPill channel={channel} viewers={false} />}
				alerts={<LiveAlerts message durationMs={7000} />}
				goal={o.goal ? <LiveGoal {...o.goalProps} width={400} /> : null}
				events={o.events ? <LiveEvents rows={2} animate width={400} /> : null}
				camera={
					o.camera ? (
						<CamFrame ratio="16:9" width={CAMERA_HOLE.width} live name={profile.camera.name} />
					) : null
				}
				chat={
					o.chat ? (
						<LiveChat
							channel={channel}
							hidden={profile.chat.hidden}
							width={528}
							height={736}
							translucent={false}
							fade
							animate
						/>
					) : null
				}
			/>
		</ChannelEventsProvider>
	);
}
