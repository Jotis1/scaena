import { Button } from "@jotis-me/react";
import { ArrowRight } from "@untitledui/icons";
import type { RepoProfile } from "@/lib/profile";
import type { Video } from "@/lib/youtube/client";
import { videoPage } from "@/lib/youtube/videos";
import { NoVideos } from "../videos/NoVideos";
import { VideoLinkCard } from "../videos/VideoLinkCard";

/** «Lo último en YouTube» (diseño: «Portada»): los tres últimos vídeos y el enlace a todos. */
export function LatestVideos({ profile, videos }: { profile: RepoProfile; videos: Video[] }) {
	const latest = videoPage(videos, "all", 1).items.slice(0, 3);
	return (
		<section aria-labelledby="ultimo">
			<div className="mx-auto flex max-w-320 flex-col gap-8 px-4 py-14 md:px-8 md:pt-22 md:pb-24">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex max-w-160 flex-col gap-2">
						<h2
							id="ultimo"
							className="font-display text-display-xs font-semibold text-primary md:text-display-sm"
						>
							Lo último en YouTube
						</h2>
						<p className="text-md text-tertiary">
							Para ponerte al día si te perdiste el directo.
						</p>
					</div>
					<Button hierarchy="secondary" size="md" href="/videos" iconTrailing={ArrowRight}>
						Ver todos los vídeos
					</Button>
				</div>
				{latest.length ? (
					<ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6">
						{latest.map((v) => (
							<VideoLinkCard key={v.id} video={v} href={`/videos?v=${v.id}`} />
						))}
					</ul>
				) : (
					<NoVideos youtube={`https://www.youtube.com/${profile.youtube.handle}`} />
				)}
			</div>
		</section>
	);
}
