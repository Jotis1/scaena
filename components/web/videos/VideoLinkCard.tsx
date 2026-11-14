import { LinkCard } from "@jotis-me/react";
import Image from "next/image";
import { cardLine } from "@/lib/youtube/title";
import type { ClassifiedVideo } from "@/lib/youtube/videos";

/**
 * Tarjeta de vídeo con el `LinkCard` de Regula (diseño: «Lo último en YouTube» y «Vídeos»): la miniatura arriba, el
 * título y una línea con el tipo, el juego y la duración. La miniatura pasa por el optimizador de Next: el navegador
 * no pide nada a YouTube hasta que se pulsa reproducir. Va como `li`: siempre dentro de una lista.
 */
export function VideoLinkCard({ video, href }: { video: ClassifiedVideo; href: string }) {
	return (
		<LinkCard
			as="li"
			href={href}
			title={video.parsed.title}
			description={cardLine(video.parsed, video.duration)}
			preview={
				<span className="relative block aspect-video bg-tertiary">
					{video.thumbnail ? (
						<Image
							src={video.thumbnail}
							alt=""
							fill
							sizes="(min-width: 1280px) 400px, (min-width: 640px) 45vw, 100vw"
							className="object-cover"
						/>
					) : null}
				</span>
			}
		/>
	);
}
