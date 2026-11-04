import { Icon } from "@jotis-me/react";
import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { gameLine, KIND_LABELS } from "@/lib/youtube/title";
import type { ClassifiedVideo } from "@/lib/youtube/videos";

/**
 * Tarjeta de vídeo (diseño: «Diario de partidas» y «Vídeos»): miniatura con la duración, tipo en gris, título y,
 * en los directos, «juego - #n». La miniatura pasa por el optimizador de Next: el navegador no pide nada a
 * YouTube hasta que se pulsa reproducir.
 */
export function VideoCard({
	video,
	href,
	meta,
	playing = false,
}: {
	video: ClassifiedVideo;
	href: string;
	meta?: string;
	playing?: boolean;
}) {
	const game = gameLine(video.parsed);
	return (
		<Link
			href={href}
			aria-current={playing ? "true" : undefined}
			className="group flex min-w-0 flex-col gap-3 rounded-xl focus-visible:shadow-focus-ring focus-visible:outline-none"
		>
			<span className="relative block aspect-video overflow-hidden rounded-xl border border-secondary bg-tertiary">
				{video.thumbnail ? (
					<Image
						src={video.thumbnail}
						alt=""
						fill
						sizes="(min-width: 1280px) 400px, (min-width: 640px) 45vw, 100vw"
						className="object-cover"
					/>
				) : null}
				{playing ? (
					<span className="dark-mode absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-sm bg-primary/85 py-0.5 pr-2 pl-1.5 text-xs font-semibold text-primary">
						<Icon name="play" size={12} />
						Reproduciendo
					</span>
				) : null}
				{/* Siempre en oscuro sobre la miniatura, también con la web en claro. */}
				<span className="dark-mode absolute right-2 bottom-2 rounded-sm bg-primary/85 px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
					{formatDuration(video.duration)}
				</span>
			</span>
			<span className="flex min-w-0 flex-col gap-1">
				<span className="text-xs font-semibold text-tertiary">{KIND_LABELS[video.parsed.kind]}</span>
				<span className="text-sm font-semibold text-primary group-hover:underline md:text-md">
					{video.parsed.title}
				</span>
				{game || meta ? (
					<span className="text-[13px] leading-[18px] text-tertiary">
						{[game, meta].filter(Boolean).join(" · ")}
					</span>
				) : null}
			</span>
		</Link>
	);
}
