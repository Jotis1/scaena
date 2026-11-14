import type { VideoFilter } from "./videos";

export interface VideosQuery {
	type: VideoFilter;
	page?: number;
	/** Vídeo en reproducción. */
	v?: string;
	/** Texto buscado. */
	q?: string;
}

/** `/videos?type=…&q=…&page=…&v=…` con solo lo que no es por defecto. */
export function videosHref({ type, page = 1, v, q }: VideosQuery): string {
	const p = new URLSearchParams();
	if (type !== "all") p.set("type", type);
	if (q) p.set("q", q);
	if (page > 1) p.set("page", String(page));
	if (v) p.set("v", v);
	const s = p.toString();
	return s ? `/videos?${s}` : "/videos";
}
