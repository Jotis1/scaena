import { Badge, Button, EmptyState, PageHeader, Pager } from "@jotis-me/react";
import { AlertTriangle, LinkExternal01, SearchLg } from "@untitledui/icons";
import type { Metadata } from "next";
import { ClickToPlay } from "@/components/web/videos/ClickToPlay";
import { ClientLinks } from "@/components/web/videos/ClientLinks";
import { NoVideos } from "@/components/web/videos/NoVideos";
import { RetryButton } from "@/components/web/videos/RetryButton";
import { VideoLinkCard } from "@/components/web/videos/VideoLinkCard";
import { VideoTabs } from "@/components/web/videos/VideoTabs";
import { formatDate, formatDuration } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { int, oneOf, type SearchParams, text } from "@/lib/overlay/params";
import { loadMainProfile } from "@/lib/profile";
import { siteVideos } from "@/lib/site";
import type { Video } from "@/lib/youtube/client";
import { videosHref } from "@/lib/youtube/href";
import { gameLine, KIND_LABELS } from "@/lib/youtube/title";
import { type ClassifiedVideo, VIDEO_FILTERS, type VideoFilter, videoPage } from "@/lib/youtube/videos";

const DESCRIPTION = "Los directos, subidos enteros, y algún editado con lo mejor.";

export function generateMetadata(): Promise<Metadata> {
	return pageMetadata({ title: "Vídeos", description: DESCRIPTION, path: "/videos" });
}
export const dynamic = "force-dynamic";

const EMPTY_TITLES: Record<VideoFilter, string> = {
	all: "Aún no hay vídeos",
	live: "Aún no hay directos resubidos",
	edited: "Aún no hay editados",
};

// Vídeos del canal (diseño: «Vídeos», con contenido, vacío, carga y error; specs/channel-site, «Página de
// vídeos»). El filtro, el texto buscado (`q`) y la página van en la URL; el vídeo en reproducción también (`v`), y no se repite en la rejilla.
export default async function VideosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const q = await searchParams;
	const profile = await loadMainProfile();
	const youtube = `https://www.youtube.com/${profile.youtube.handle}`;
	const type = oneOf(q, "type", VIDEO_FILTERS, "all");
	const { videos, stale } = await siteVideos();
	const query = text(q, "q", "", 80).trim();
	const list = videoPage(videos, type, int(q, "page", 1, { min: 1 }), query);
	const vid = text(q, "v", "", 20);
	// El vídeo de `v` si existe; si no, el primero de la página.
	const featured = (vid ? classifiedById(videos, vid) : undefined) ?? list.items[0];
	const grid = featured ? list.items.filter((v) => v.id !== featured.id) : [];

	return (
		<div className="mx-auto flex w-full max-w-320 flex-col gap-8 px-4 pt-8 pb-12 md:gap-12 md:px-8 md:pt-14 md:pb-24">
			<PageHeader title="Vídeos" description={DESCRIPTION}>
				<div className="mt-5">
					<VideoTabs value={type} q={query} />
				</div>
			</PageHeader>

			{!videos.length && stale ? (
				<div
					role="alert"
					className="flex justify-center rounded-xl border border-secondary px-4 py-12 md:py-22"
				>
					<EmptyState
						size="md"
						icon={AlertTriangle}
						title="YouTube no contesta"
						description="La lista de vídeos no ha llegado. No es cosa tuya: vuelve a intentarlo en un rato o míralos directamente en YouTube."
						actions={
							<>
								<Button
									hierarchy="secondary"
									size="md"
									href={youtube}
									iconTrailing={LinkExternal01}
								>
									Abrir YouTube
								</Button>
								<RetryButton />
							</>
						}
					/>
				</div>
			) : query && !list.items.length ? (
				<section className="flex justify-center rounded-xl border border-secondary px-4 py-12 md:py-22">
					{/* `EmptyState` titula con `h3`: este `h2` evita el salto desde el `h1` de la página. */}
					<h2 className="sr-only">Resultados de la búsqueda</h2>
					<EmptyState
						size="md"
						icon={SearchLg}
						title={`Nada con "${query}"`}
						description="Prueba con otra palabra del título o con el nombre del juego."
						actions={
							<Button hierarchy="secondary" size="md" href={videosHref({ type })}>
								Quitar la búsqueda
							</Button>
						}
					/>
				</section>
			) : !list.items.length || !featured ? (
				<NoVideos youtube={youtube} title={EMPTY_TITLES[type]} />
			) : (
				<>
					<section
						aria-label="Reproduciendo"
						className="flex flex-wrap items-start gap-x-10 gap-y-6"
					>
						<div className="dark-mode aspect-video min-w-0 flex-[999_1_560px] overflow-hidden rounded-xl border border-secondary bg-primary">
							<ClickToPlay
								id={featured.id}
								title={featured.parsed.title}
								thumbnail={featured.thumbnail}
							/>
						</div>
						<div className="flex min-w-0 flex-[1_1_280px] flex-col items-start gap-3">
							<Badge color="gray" type="pill" size="md">
								{KIND_LABELS[featured.parsed.kind]}
							</Badge>
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
									.join(", ")}
							</p>
							<Button
								hierarchy="secondary"
								size="md"
								href={`https://www.youtube.com/watch?v=${featured.id}`}
								iconTrailing={LinkExternal01}
								className="mt-2"
							>
								Abrir en YouTube
							</Button>
						</div>
					</section>

					<section aria-label={`Página ${list.page} de vídeos`} className="flex flex-col gap-8">
						<ClientLinks>
							{grid.length ? (
								<ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
									{grid.map((v) => (
										<VideoLinkCard
											key={v.id}
											video={v}
											href={videosHref({ type, q: query, page: list.page, v: v.id })}
										/>
									))}
								</ul>
							) : null}
						</ClientLinks>
						<Pager
							aria-label="Más vídeos"
							prev={
								list.page > 1
									? {
											href: videosHref({ type, q: query, page: list.page - 1 }),
											label: `Página ${list.page - 1}`,
										}
									: undefined
							}
							next={
								list.page < list.pages
									? {
											href: videosHref({ type, q: query, page: list.page + 1 }),
											label: `Página ${list.page + 1}`,
										}
									: undefined
							}
							labels={{ previous: "Más recientes", next: "Anteriores" }}
						/>
					</section>
				</>
			)}
		</div>
	);
}

function classifiedById(videos: Video[], id: string): ClassifiedVideo | undefined {
	const v = videos.find((x) => x.id === id);
	return v ? videoPage([v], "all", 1).items[0] : undefined;
}
