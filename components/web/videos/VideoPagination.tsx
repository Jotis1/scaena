"use client";

import { Pagination } from "@jotis-me/react";
import { useRouter } from "next/navigation";

/**
 * Paginación de `/videos` con el `Pagination` de Regula: «Más recientes» y «Anteriores» (diseño), y la página va en
 * la URL (`page`), junto al filtro.
 */
export function VideoPagination({ page, pages, type }: { page: number; pages: number; type: string }) {
	const router = useRouter();
	const go = (n: number) => {
		const q = new URLSearchParams();
		if (type !== "all") q.set("type", type);
		if (n > 1) q.set("page", String(n));
		const s = q.toString();
		router.push(s ? `/videos?${s}` : "/videos");
	};
	return (
		<Pagination
			total={pages}
			page={page}
			onChange={go}
			labels={{
				previous: "Más recientes",
				next: "Anteriores",
				nav: "Paginación",
				page: (n) => `Página ${n}`,
			}}
		/>
	);
}
