"use client";

import { Avatar, Button, Tabs } from "@jotis-me/react";
import { LogOut01 } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { STUDIO_PAGES, studioPageOf } from "@/lib/studio/pages";

/**
 * Barra de secciones del estudio, bajo la cabecera de la web (diseño: «Navegación del Studio»; specs/channel-site,
 * «Navegación del estudio»). Las pestañas llevan `href`, así que `Tabs` las pinta como una `<nav>` de enlaces con
 * `aria-current`. A la derecha, la cuenta de la sesión y «Salir». Con `wrap-reverse`, en el móvil la cuenta queda
 * arriba y las pestañas se desplazan dentro de su caja.
 */
export function StudioSections({ name }: { name: string }) {
	const path = usePathname();
	const router = useRouter();
	const signOut = async () => {
		await authClient.signOut();
		router.replace("/studio/login");
		router.refresh();
	};
	return (
		<div className="border-b border-secondary bg-secondary">
			<div className="mx-auto flex max-w-320 flex-wrap-reverse items-center justify-between gap-x-8 px-[min(32px,4.2%)]">
				<div className="min-w-0 flex-[1_1_420px] overflow-x-auto pt-2">
					<Tabs
						type="underline"
						size="md"
						aria-label="Secciones del estudio"
						value={studioPageOf(path)?.id}
						items={STUDIO_PAGES.map((p) => ({ id: p.id, label: p.label, href: p.href }))}
					/>
				</div>
				<section aria-label="Cuenta" className="flex items-center gap-3 py-2.5">
					<Avatar size="sm" initials={name.charAt(0).toUpperCase()} alt={name} />
					<div className="flex min-w-0 flex-col">
						<span className="text-sm font-semibold text-primary">{name}</span>
						<span className="text-xs text-tertiary">Cuenta de Twitch</span>
					</div>
					<Button hierarchy="secondary" size="sm" iconLeading={LogOut01} onClick={signOut}>
						Salir
					</Button>
				</section>
			</div>
		</div>
	);
}
