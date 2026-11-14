"use client";

import { Badge, SidebarNav } from "@jotis-me/react";
import { BookOpen01, Grid01, Image01, Link01 } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import { ScaenaBrand } from "@/components/web/ScaenaBrand";
import { authClient } from "@/lib/auth-client";

// Barra lateral del estudio con el `SidebarNav` de Regula (diseño: «Estudio»). Sin selector de canal: el canal
// sale de la sesión. En el escritorio va fija y con el alto de la ventana, así que la cuenta y «Salir» se ven
// siempre; por debajo de `lg` es una barra arriba con el menú.
export const STUDIO_PAGES = [
	{ href: "/studio/overlays", label: "Overlays", icon: <Grid01 size={24} /> },
	{ href: "/studio/guide", label: "Guía de OBS", icon: <BookOpen01 size={24} /> },
	{ href: "/studio/assets", label: "Recursos", icon: <Image01 size={24} /> },
	{ href: "/studio/connection", label: "Conexión", icon: <Link01 size={24} /> },
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
		<div className="flex-none lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:overflow-y-auto">
			<SidebarNav
				brand={
					<span className="flex items-center gap-2.5">
						<ScaenaBrand size={32} />
						<Badge color="gray" type="badge" size="sm">
							Estudio
						</Badge>
					</span>
				}
				items={STUDIO_PAGES.map((p) => ({ ...p, active: path === p.href }))}
				user={{ initials: name.charAt(0).toUpperCase(), name, supporting: "Cuenta de Twitch" }}
				onLogout={signOut}
				responsive
				labels={{ nav: "Estudio", logout: "Salir" }}
				className="lg:min-h-full"
			/>
		</div>
	);
}
