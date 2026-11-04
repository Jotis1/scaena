"use client";

import { Icon } from "@jotis-me/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Reproductor de clic para cargar (design.md, decisión 7): miniatura y botón; al pulsar se inserta el `iframe` de
 * `youtube-nocookie.com`. Hasta entonces el navegador no pide nada a YouTube. Si se llega aquí pulsando una
 * tarjeta de la lista, ese clic ya cuenta y el vídeo empieza a reproducirse.
 */
export function ClickToPlay({ id, title, thumbnail }: { id: string; title: string; thumbnail: string }) {
	const first = useRef(id);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		setPlaying(id !== first.current);
	}, [id]);

	if (playing)
		return (
			<iframe
				key={id}
				src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`}
				title={title}
				allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
				allowFullScreen
				className="size-full"
			/>
		);

	return (
		<button
			type="button"
			onClick={() => setPlaying(true)}
			aria-label={`Reproducir «${title}»`}
			className="group relative block size-full cursor-pointer focus-visible:shadow-focus-ring focus-visible:outline-none"
		>
			{thumbnail ? (
				<Image
					src={thumbnail}
					alt=""
					fill
					sizes="(min-width: 1280px) 800px, 100vw"
					className="object-cover"
					priority
				/>
			) : null}
			<span className="dark-mode absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/85 text-primary shadow-lg transition-colors duration-100 group-hover:bg-primary">
				<Icon name="play" size={28} />
			</span>
		</button>
	);
}
