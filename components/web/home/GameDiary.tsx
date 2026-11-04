import { Button, EmptyState } from "@jotis-me/react";
import { VideoCard } from "@/components/web/VideoCard";
import type { Profile } from "@/lib/profile";
import type { Video } from "@/lib/youtube/client";
import { videoPage } from "@/lib/youtube/videos";

/** «Diario de partidas»: los seis últimos vídeos y el enlace a todos (diseño: portada). */
export function GameDiary({ profile, videos }: { profile: Profile; videos: Video[] }) {
	const latest = videoPage(videos, "all", 1).items.slice(0, 6);
	return (
		<section aria-labelledby="diary">
			<div className="mx-auto flex max-w-320 flex-col gap-8 px-4 py-14 md:px-8 md:pt-20 md:pb-24">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex max-w-160 flex-col gap-1">
						<h2
							id="diary"
							className="font-display text-display-xs font-semibold text-primary md:text-display-sm"
						>
							Diario de partidas
						</h2>
						<p className="text-md text-tertiary">
							Lo que ya ha quedado grabado en YouTube: los directos, resubidos enteros, y los
							editados.
						</p>
					</div>
					<Button hierarchy="secondary" size="md" href="/videos" iconTrailing="arrow-right">
						Ver todos los vídeos
					</Button>
				</div>
				{latest.length ? (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-4 md:gap-6 lg:gap-8">
						{latest.map((v) => (
							<VideoCard key={v.id} video={v} href={`/videos?v=${v.id}`} />
						))}
					</div>
				) : (
					<EmptyState
						icon="play"
						title="Aún no hay nada grabado"
						description="El primer directo resubido llegará pronto. Mientras, el canal de YouTube está aquí."
						actions={
							<Button
								hierarchy="secondary"
								size="md"
								href={`https://www.youtube.com/${profile.youtube.handle}`}
								iconTrailing="link-external-01"
							>
								Abrir YouTube
							</Button>
						}
					/>
				)}
			</div>
		</section>
	);
}
