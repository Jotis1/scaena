import { BackgroundPattern, Badge, Button, EmptyState, FeaturedIcon } from "@jotis-me/react";
import type { Metadata } from "next";
import { VideoCard } from "@/components/web/VideoCard";
import { ClickToPlay } from "@/components/web/videos/ClickToPlay";
import { RetryButton } from "@/components/web/videos/RetryButton";
import { VideoTabs } from "@/components/web/videos/VideoTabs";
import { formatDate, formatDuration } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { int, oneOf, type SearchParams, text } from "@/lib/overlay/params";
import { getMainProfile } from "@/lib/profile";
import { siteVideos } from "@/lib/site";
import type { Video } from "@/lib/youtube/client";
import { gameLine, KIND_LABELS } from "@/lib/youtube/title";
import { type ClassifiedVideo, VIDEO_FILTERS, type VideoFilter, videoPage } from "@/lib/youtube/videos";

export function generateMetadata(): Metadata {
	return pageMetadata({
		title: "Vídeos",
		description: "El diario de partidas. Los directos, resubidos enteros, y los editados.",
		path: "/videos",
	});
}
export const dynamic = "force-dynamic";

const EMPTY_TITLES: Record<VideoFilter, string> = {
	all: "Aún no hay vídeos",
	live: "Aún no hay directos resubidos",
	edited: "Aún no hay editados",
};

/** `/videos?type=…&page=…&v=…` con solo lo que no es por defecto. */
function videosHref(q: { type: VideoFilter; page: number; v?: string }): string {
	const p = new URLSearchParams();
	if (q.type !== "all") p.set("type", q.type);
	if (q.page > 1) p.set("page", String(q.page));
	if (q.v) p.set("v", q.v);
	const s = p.toString();
	return s ? `/videos?${s}` : "/videos";
}

// Vídeos del canal (diseño: «Vídeos», con contenido, vacío, carga y error; specs/channel-site, «Página de
// vídeos»). El filtro y la página van en la URL; el vídeo en reproducción también (`v`).
export default async function VideosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const q = await searchParams;
	const profile = getMainProfile();
	const youtube = `https://www.youtube.com/${profile.youtube.handle}`;
	const type = oneOf(q, "type", VIDEO_FILTERS, "all");
	const { videos, stale } = await siteVideos();
	const list = videoPage(videos, type, int(q, "page", 1, { min: 1 }));
	const vid = text(q, "v", "", 20);
	// El vídeo de `v` si existe; si no, el primero de la página.
	const featured = (vid ? classifiedById(videos, vid) : undefined) ?? list.items[0];

	return (
		<div className="mx-auto flex max-w-320 flex-col gap-6 px-4 pt-8 pb-12 md:gap-8 md:px-8 md:pt-12 md:pb-20 lg:gap-12 lg:pt-16 lg:pb-24">
			<div className="flex flex-col gap-5">
				<div className="flex max-w-180 flex-col gap-1">
					<h1 className="font-display text-display-sm font-semibold tracking-tight text-primary md:text-display-md">
						Vídeos
					</h1>
					<p className="text-md text-tertiary">
						El diario de partidas. Los directos, resubidos enteros, y los editados.
					</p>
				</div>
				<VideoTabs value={type} />
			</div>

			{!videos.length && stale ? (
				<div
					role="alert"
					className="flex flex-col items-center gap-4 rounded-xl border border-secondary px-4 py-10 text-center md:py-18"
				>
					<FeaturedIcon icon="alert-triangle" color="error" size="lg" variant="light" />
					<div className="flex max-w-110 flex-col gap-1">
						<h2 className="text-lg font-semibold text-primary">YouTube no contesta</h2>
						<p className="text-sm text-tertiary">
							La lista de vídeos no ha llegado. No es cosa tuya: vuelve a intentarlo en un rato
							o míralos directamente en YouTube.
						</p>
					</div>
					<div className="flex flex-wrap justify-center gap-3 pt-2">
						<Button
							hierarchy="secondary"
							size="md"
							href={youtube}
							iconTrailing="link-external-01"
						>
							Abrir YouTube
						</Button>
						<RetryButton />
					</div>
				</div>
			) : !list.items.length || !featured ? (
				<div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-xl border border-secondary px-4 py-10 md:py-18">
					<div aria-hidden="true" className="pointer-events-none absolute inset-0">
						<BackgroundPattern pattern="circles" size="md" mask="radial" className="size-full" />
					</div>
					<div className="relative">
						<EmptyState
							icon="play"
							title={EMPTY_TITLES[type]}
							description="El primero está en camino."
						/>
					</div>
					<div className="relative">
						<Button
							hierarchy="secondary"
							size="md"
							href={youtube}
							iconTrailing="link-external-01"
						>
							Ver el canal en YouTube
						</Button>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-6 md:gap-8 lg:gap-12">
					<section
						aria-label="Reproduciendo"
						className="flex flex-wrap items-start gap-x-10 gap-y-6"
					>
						<div className="dark-mode aspect-video min-w-0 flex-[999_1_640px] overflow-hidden rounded-xl border border-secondary bg-primary">
							<ClickToPlay
								id={featured.id}
								title={featured.parsed.title}
								thumbnail={featured.thumbnail}
							/>
						</div>
						<div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
							<div className="flex flex-wrap gap-2">
								<Badge color="gray" type="pill" size="md">
									{KIND_LABELS[featured.parsed.kind]}
								</Badge>
							</div>
							<div className="flex flex-col gap-1.5">
								<h2 className="font-display text-display-xs font-semibold text-primary">
									{featured.parsed.title}
								</h2>
								<p className="text-sm text-tertiary tabular-nums">
									{[
										gameLine(featured.parsed),
										formatDuration(featured.duration),
										formatDate(featured.publishedAt),
									]
										.filter(Boolean)
										.join(" - ")}
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button
									hierarchy="secondary"
									size="md"
									href={`https://www.youtube.com/watch?v=${featured.id}`}
									iconTrailing="link-external-01"
								>
									Abrir en YouTube
								</Button>
							</div>
						</div>
					</section>

					<section aria-label={`Página ${list.page} de vídeos`} className="flex flex-col gap-6">
						<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 lg:gap-6">
							{list.items.map((v) => (
								<VideoCard
									key={v.id}
									video={v}
									href={videosHref({ type, page: list.page, v: v.id })}
									playing={v.id === featured.id}
								/>
							))}
						</div>
						<nav
							aria-label="Paginación"
							className="flex items-center justify-between gap-3 border-t border-secondary pt-5"
						>
							{list.page > 1 ? (
								<Button
									hierarchy="secondary"
									size="sm"
									href={videosHref({ type, page: list.page - 1 })}
									iconLeading="arrow-left"
								>
									Más recientes
								</Button>
							) : (
								<Button hierarchy="secondary" size="sm" disabled iconLeading="arrow-left">
									Más recientes
								</Button>
							)}
							<span className="text-sm text-tertiary">
								Página {list.page} de {list.pages}
							</span>
							{list.page < list.pages ? (
								<Button
									hierarchy="secondary"
									size="sm"
									href={videosHref({ type, page: list.page + 1 })}
									iconTrailing="arrow-right"
								>
									Anteriores
								</Button>
							) : (
								<Button hierarchy="secondary" size="sm" disabled iconTrailing="arrow-right">
									Anteriores
								</Button>
							)}
						</nav>
					</section>
				</div>
			)}
		</div>
	);
}

function classifiedById(videos: Video[], id: string): ClassifiedVideo | undefined {
	const v = videos.find((x) => x.id === id);
	return v ? videoPage([v], "all", 1).items[0] : undefined;
}
