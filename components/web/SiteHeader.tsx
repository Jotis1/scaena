import { AppIcon } from "@jotis-me/react";
import Link from "next/link";
import { SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Cabecera de la web (decidido): icono «Sc» y «Scaena» en Bricolage bold `text-primary`, el estilo que la guía da
 * a «jotis.me», sin «jotis.me». Un único botón de tema.
 */
export function SiteHeader() {
	return (
		<header className="border-b border-secondary bg-primary">
			<div className="mx-auto flex max-w-320 items-center gap-4 px-4 py-3 md:px-8">
				<Link
					href="/"
					className="flex items-center gap-2.5 rounded-md text-primary focus-visible:shadow-focus-ring focus-visible:outline-none"
				>
					<AppIcon letters="Sc" hue="lime" size={32} label="Scaena" />
					<span className="font-display text-xl font-bold text-primary">Scaena</span>
				</Link>
				<SiteNav />
				<span aria-hidden="true" className="flex-auto" />
				<ThemeToggle />
			</div>
		</header>
	);
}
