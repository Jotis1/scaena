"use client";

import { SidebarNav } from "@jotis-me/react";
import { BookOpen01, Image01, LayersThree01, Link03 } from "@untitledui/icons";
import { usePathname } from "next/navigation";
import { STUDIO_PAGES, studioPageOf } from "@/lib/studio/pages";

const ICONS = { overlays: LayersThree01, guide: BookOpen01, assets: Image01, connection: Link03 } as const;

/**
 * Barra lateral del estudio (specs/channel-site, «Navegación del estudio»): las cuatro secciones, la actual marcada,
 * bajo la cabecera de la web. Sin título: la cabecera ya marca «Estudio» y cada página tiene el suyo. La cuenta va en
 * la cabecera (`AccountMenu`), no aquí. En pantallas estrechas se recoge y un botón la abre.
 */
export function StudioSidebar() {
	const current = studioPageOf(usePathname());
	return (
		<SidebarNav
			type="simple"
			responsive
			// En el móvil, la franja que abre el menú dice qué abre; en escritorio no hay título (la cabecera ya marca «Estudio»).
			brand={<span className="text-md lg:hidden">Secciones del estudio</span>}
			labels={{ nav: "Secciones del estudio", menu: "Secciones del estudio" }}
			items={STUDIO_PAGES.map((p) => ({
				label: p.label,
				href: p.href,
				icon: ICONS[p.id],
				active: current?.id === p.id,
			}))}
		/>
	);
}
