"use client";

import { Tabs } from "@jotis-me/react";
import { useRouter } from "next/navigation";
import type { VideoFilter } from "@/lib/youtube/videos";

const TABS: { id: VideoFilter; label: string }[] = [
	{ id: "all", label: "Todos" },
	{ id: "live", label: "Directos" },
	{ id: "edited", label: "Editados" },
];

/** «Todos», «Directos» y «Editados» (`type`). Cambiar de pestaña vuelve a la primera página. */
export function VideoTabs({ value }: { value: VideoFilter }) {
	const router = useRouter();
	return (
		<Tabs
			items={TABS}
			value={value}
			type="button-gray"
			size="sm"
			aria-label="Tipo de vídeo"
			onChange={(id) => router.push(id === "all" ? "/videos" : `/videos?type=${id}`, { scroll: false })}
		/>
	);
}
