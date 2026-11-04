"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
	{ href: "/", label: "Inicio" },
	{ href: "/videos", label: "Vídeos" },
];

/** Navegación principal de la web (diseño: cabecera de la portada). */
export function SiteNav() {
	const path = usePathname();
	return (
		<nav aria-label="Principal" className="ml-4 flex gap-1">
			{LINKS.map((l) => {
				const current = l.href === "/" ? path === "/" : path.startsWith(l.href);
				return (
					<Link
						key={l.href}
						href={l.href}
						aria-current={current ? "page" : undefined}
						className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-100 focus-visible:shadow-focus-ring focus-visible:outline-none ${
							current ? "bg-secondary text-primary" : "text-tertiary hover:text-secondary"
						}`}
					>
						{l.label}
					</Link>
				);
			})}
		</nav>
	);
}
