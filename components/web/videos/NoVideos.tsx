import { BackgroundPattern, Button, EmptyState } from "@jotis-me/react";
import { LinkExternal01, Play } from "@untitledui/icons";

/**
 * Estado vacío de los vídeos (diseño: «Vídeos - vacío»), en la portada y en la página de vídeos: `EmptyState` sobre
 * el patrón de círculos y el enlace al canal de YouTube.
 */
export function NoVideos({ youtube, title = "Aún no hay vídeos" }: { youtube: string; title?: string }) {
	return (
		<div className="relative flex justify-center overflow-hidden rounded-xl border border-secondary px-4 py-12 md:py-22">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<BackgroundPattern pattern="circles" size="md" mask="radial" className="size-full" />
			</div>
			<EmptyState
				size="md"
				icon={Play}
				title={title}
				description="El primero llega en cuanto acabe un directo."
				actions={
					<Button hierarchy="secondary" size="md" href={youtube} iconTrailing={LinkExternal01}>
						Ver el canal en YouTube
					</Button>
				}
				className="relative"
			/>
		</div>
	);
}
