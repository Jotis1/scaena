import type { Metadata } from "next";
import { Hero } from "@/components/web/home/Hero";
import { LatestVideos } from "@/components/web/home/LatestVideos";
import { StreamJourney } from "@/components/web/home/StreamJourney";
import { fillPhrase } from "@/lib/alerts/phrase";
import { pageMetadata } from "@/lib/metadata";
import { getMainProfile } from "@/lib/profile";
import { sceneFooter, usuallyLiveText } from "@/lib/profile/schedule";
import { linkedSocials } from "@/lib/profile/socials";
import { siteVideos } from "@/lib/site";

// Portada (diseño: «Portada» y «Portada en directo»; specs/channel-site, «Portada del canal»), en tres secciones y
// en este orden. El estado del directo lo pone el layout; los vídeos salen de la caché de YouTube.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
	return pageMetadata({ path: "/" });
}

export default async function Home() {
	const profile = getMainProfile();
	const { videos } = await siteVideos();
	const footer = sceneFooter(profile.schedule);
	const camera = profile.camera.name;
	const game = {
		cameraName: camera,
		alertDetail: fillPhrase(profile.alerts.raid, { type: "raid", amount: 1284 }),
	};
	const { journey, scenes } = profile;
	return (
		<>
			<Hero
				login={profile.twitch.login}
				tagline={profile.tagline}
				intro={profile.site.intro}
				usually={usuallyLiveText(profile.schedule)}
				offline={{ ...scenes.offline, next: footer }}
				scene={game}
			/>
			<StreamJourney
				login={profile.twitch.login}
				steps={[journey.before, journey.game, journey.chatting, journey.after]}
				beforeHint={`Sobre las ${profile.schedule.start}`}
				starting={scenes.starting}
				ending={scenes.ending}
				footer={footer}
				game={game}
				chatting={{
					cameraName: camera,
					alertDetail: fillPhrase(profile.alerts.resub, { type: "resub", months: 14 }),
				}}
				discordUrl={linkedSocials(profile).find((s) => s.network === "discord")?.url}
			/>
			<LatestVideos profile={profile} videos={videos} />
		</>
	);
}
