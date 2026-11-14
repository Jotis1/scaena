import { PageHeader, Skeleton } from "@jotis-me/react";

// Carga de `/videos` (diseño: «Vídeos - cargando»): mientras el servidor pide la lista a YouTube, el hueco del
// reproductor, de su texto y de ocho tarjetas, marcado como ocupado.
export default function VideosLoading() {
	return (
		<div className="mx-auto flex w-full max-w-320 flex-col gap-8 px-4 pt-8 pb-12 md:gap-12 md:px-8 md:pt-14 md:pb-24">
			<PageHeader
				title="Vídeos"
				description="Los directos, subidos enteros, y algún editado con lo mejor."
			/>
			<section aria-busy="true" aria-label="Cargando vídeos" className="flex flex-col gap-8 md:gap-12">
				<div className="flex flex-wrap items-start gap-x-10 gap-y-6">
					<div className="aspect-video min-w-0 flex-[999_1_560px]">
						<Skeleton width="100%" height="100%" radius="12px" />
					</div>
					<div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
						<Skeleton width="140px" height="24px" radius="999px" />
						<Skeleton lines={3} />
					</div>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
					{Array.from({ length: 8 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: huecos fijos, sin datos
						<div key={i} className="flex flex-col gap-3">
							<div className="aspect-video">
								<Skeleton width="100%" height="100%" radius="12px" />
							</div>
							<Skeleton lines={2} />
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
