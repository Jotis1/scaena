"use client";

import { Icon, type IconName } from "@jotis-me/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra lateral del estudio (diseño: «Estudio»). Sin selector de canal: el canal sale de la sesión.
export const STUDIO_PAGES: { href: string; label: string; icon: IconName }[] = [
	{ href: "/studio/overlays", label: "Overlays", icon: "grid-01" },
	{ href: "/studio/assets", label: "Recursos", icon: "image-01" },
	{ href: "/studio/connection", label: "Conexión", icon: "link-01" },
];

export function StudioNav() {
	const path = usePathname();
	return (
		<nav aria-label="Estudio" className="flex flex-col gap-0.5">
			{STUDIO_PAGES.map((p) => {
				const current = path === p.href;
				return (
					<Link
						key={p.href}
						href={p.href}
						aria-current={current ? "page" : undefined}
						className={`flex items-center gap-3 rounded-md px-3 py-2 text-md font-semibold transition-colors duration-100 focus-visible:outline-none focus-visible:shadow-focus-ring ${
							current
								? "bg-primary text-primary ring-1 ring-secondary ring-inset"
								: "text-secondary hover:bg-primary_hover"
						}`}
					>
						<Icon name={p.icon} size={20} className="text-fg-tertiary" />
						<span>{p.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}

/** Nombre de la página actual para la barra superior: «Estudio › Overlays». */
export function StudioPageName() {
	const path = usePathname();
	const page = STUDIO_PAGES.find((p) => p.href === path);
	return (
		<>
			<span className="text-sm font-semibold text-secondary">{page?.label ?? "Estudio"}</span>
			<span className="ml-auto hidden font-mono text-[13px] leading-5 text-quaternary md:inline">
				scaena.jotis.me{path}
			</span>
		</>
	);
}
