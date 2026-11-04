import { Skeleton } from "@jotis-me/react";

// Carga de `/videos` (diseño: «Vídeos», carga): mientras el servidor pide la lista a YouTube.
export default function VideosLoading() {
	return (
		<div className="mx-auto flex max-w-320 flex-col gap-6 px-4 pt-8 pb-12 md:gap-8 md:px-8 md:pt-12 md:pb-20 lg:gap-12 lg:pt-16">
			<div aria-busy="true" className="flex flex-col gap-6 md:gap-8 lg:gap-12">
				<span className="sr-only">Cargando vídeos</span>
				<div className="flex flex-wrap items-start gap-x-10 gap-y-6">
					<div className="aspect-video min-w-0 flex-[999_1_640px]">
						<Skeleton width="100%" height="100%" radius="12px" />
					</div>
					<div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
						<Skeleton width="120px" height="24px" radius="999px" />
						<Skeleton lines={3} />
					</div>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 lg:gap-6">
					{Array.from({ length: 8 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: huecos fijos, sin datos
						<div key={i} className="flex flex-col gap-2.5">
							<div className="aspect-video">
								<Skeleton width="100%" height="100%" radius="12px" />
							</div>
							<Skeleton lines={2} />
						</div>
					))}
				</div>
				<p className="text-sm text-tertiary">Pidiendo los vídeos a YouTube.</p>
			</div>
		</div>
	);
}
