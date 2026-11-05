"use client";

import { AppIcon, Badge, type IconName, SidebarNav } from "@jotis-me/react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Barra lateral del estudio con el `SidebarNav` de Regula (diseño: «Estudio»). Sin selector de canal: el canal
// sale de la sesión. Va fija y con el alto de la ventana, así que la cuenta y «Salir» se ven siempre.
export const STUDIO_PAGES: { href: string; label: string; icon: IconName }[] = [
	{ href: "/studio/overlays", label: "Overlays", icon: "grid-01" },
	{ href: "/studio/assets", label: "Recursos", icon: "image-01" },
	{ href: "/studio/connection", label: "Conexión", icon: "link-01" },
];

export function StudioSidebar({ name }: { name: string }) {
	const path = usePathname();
	const router = useRouter();
	const signOut = async () => {
		await authClient.signOut();
		router.replace("/studio/login");
		router.refresh();
	};
	return (
		<div className="sticky top-0 h-screen max-h-screen flex-none overflow-y-auto">
			<SidebarNav
				brand={
					<>
						<AppIcon letters="Sc" hue="lime" size={32} label="Scaena" />
						<span className="text-xl">Scaena</span>
						<Badge color="gray" type="badge" size="sm">
							Estudio
						</Badge>
					</>
				}
				items={STUDIO_PAGES.map((p) => ({ ...p, active: path === p.href }))}
				user={{ initials: name.charAt(0).toUpperCase(), name, supporting: "Cuenta de Twitch" }}
				onLogout={signOut}
				labels={{ nav: "Estudio", logout: "Salir" }}
				className="min-h-full"
			/>
		</div>
	);
}

/** Migas de la barra superior: «Estudio › Overlays». */
export function studioCrumbs(path: string): { label: string; href?: string }[] {
	const page = STUDIO_PAGES.find((p) => p.href === path);
	return [{ label: "Estudio", href: "/studio" }, ...(page ? [{ label: page.label }] : [])];
}
