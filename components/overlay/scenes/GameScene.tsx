import { CamFrame } from "@jotis-me/react";
import type { Profile } from "@/lib/profile";
import { ChannelEventsProvider } from "../ChannelEvents";
import { LiveAlerts } from "../LiveAlerts";
import { LiveChat } from "../LiveChat";
import { LiveEvents } from "../LiveEvents";
import { LiveGoal } from "../LiveGoal";
import { LiveStatusPill } from "../LiveStatusPill";
import { GameLayout } from "./layouts";
import type { SceneOptions } from "./params";

/**
 * Escena de juego en vivo (design.md, decisión 15). Cada pieza es la misma del overlay suelto y todas comparten
 * una conexión SSE. El juego y la cámara los pone OBS debajo.
 */
export function GameScene({ profile, o }: { profile: Profile; o: SceneOptions }) {
	const channel = profile.twitch.login;
	return (
		<ChannelEventsProvider channel={channel} token={o.token} since={o.since}>
			<GameLayout
				status={<LiveStatusPill channel={channel} viewers={false} />}
				alerts={<LiveAlerts message durationMs={7000} />}
				goal={o.goal ? <LiveGoal {...o.goalProps} width={400} /> : null}
				chat={
					o.chat ? (
						<LiveChat
							channel={channel}
							hidden={profile.chat.hidden}
							width={400}
							height={440}
							translucent={o.translucent}
							fade
							animate
						/>
					) : null
				}
				events={o.events ? <LiveEvents rows={4} animate width={384} /> : null}
				camera={
					o.camera ? <CamFrame ratio="16:9" width={384} live name={profile.camera.name} /> : null
				}
			/>
		</ChannelEventsProvider>
	);
}
