"use client";

import { Tabs } from "@jotis-me/react";
import { useRouter } from "next/navigation";
import { videosHref } from "@/lib/youtube/href";
import type { VideoFilter } from "@/lib/youtube/videos";

const TABS: { id: VideoFilter; label: string }[] = [
	{ id: "all", label: "Todos" },
	{ id: "live", label: "Directos" },
	{ id: "edited", label: "Editados" },
];

/** «Todos», «Directos» y «Editados» (`type`). Cambiar de pestaña vuelve a la primera página y conserva la búsqueda. */
export function VideoTabs({ value, q }: { value: VideoFilter; q?: string }) {
	const router = useRouter();
	return (
		<Tabs
			items={TABS}
			value={value}
			type="button-gray"
			size="sm"
			aria-label="Tipo de vídeo"
			onChange={(id) => router.push(videosHref({ type: id as VideoFilter, q }), { scroll: false })}
		/>
	);
}
