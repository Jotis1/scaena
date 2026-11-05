"use client";

import { Breadcrumbs } from "@jotis-me/react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/web/ThemeToggle";
import { studioCrumbs } from "./StudioSidebar";

/** Barra superior del estudio: migas con `Breadcrumbs` de Regula, la URL de la página y el botón de tema. */
export function StudioTopBar() {
	const path = usePathname();
	return (
		<div className="flex items-center gap-3 border-b border-secondary px-8 py-3">
			<Breadcrumbs items={studioCrumbs(path)} aria-label="Ruta en el estudio" />
			<span className="ml-auto hidden font-mono text-[13px] leading-5 text-quaternary md:inline">
				scaena.jotis.me{path}
			</span>
			<ThemeToggle />
		</div>
	);
}
