import type { Metadata } from "next";
import { GameDiary } from "@/components/web/home/GameDiary";
import { WhenAndWhere } from "@/components/web/home/WhenAndWhere";
import { WhoPlays } from "@/components/web/home/WhoPlays";
import { pageMetadata } from "@/lib/metadata";
import { getMainProfile } from "@/lib/profile";
import { siteVideos } from "@/lib/site";

// Portada (diseño: «Portada»; specs/channel-site, «Portada del canal»), en cuatro secciones y en este orden.
// El estado del directo lo pone el layout; los vídeos salen de la caché de YouTube.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
	return pageMetadata({ path: "/" });
}

export default async function Home() {
	const profile = getMainProfile();
	const { videos } = await siteVideos();
	return (
		<>
			<WhoPlays profile={profile} />
			<WhenAndWhere profile={profile} />
			<GameDiary profile={profile} videos={videos} />
		</>
	);
}
