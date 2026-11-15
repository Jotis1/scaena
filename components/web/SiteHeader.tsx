"use client";

import { HeaderNav } from "@jotis-me/react";
import { usePathname } from "next/navigation";
import { STUDIO_PAGES, studioPageOf } from "@/lib/studio/pages";
import { ScaenaBrand } from "./ScaenaBrand";
import { ThemeMenu } from "./ThemeMenu";
import { VideoSearch } from "./VideoSearch";

/**
 * Cabecera de la web con el `HeaderNav` de Regula: subrayada y a todo el ancho, con la marca, «Inicio» y «Vídeos» (la
 * página actual subrayada) y, a la derecha, el selector de tema y el buscador (specs/channel-site, «Diseño de la
 * suite»; design.md, decisión 1). Por debajo de 1024 px de cabecera, la navegación va en el menú: el selector de tema
 * sigue en la fila de arriba (`mobileActions`) y el buscador pasa al panel del menú (`search`).
 *
 * Con `studio`, la cabecera del estudio: añade «Estudio», actual, con sus secciones dentro, que en el móvil salen en
 * el menú (specs/channel-site, «Navegación del estudio»). La web pública no lo pasa: no enseña «Estudio».
 */
export function SiteHeader({ studio = false }: { studio?: boolean }) {
	const path = usePathname();
	return (
		<HeaderNav
			type="underline"
			fullWidth
			mobileActions
			brand={
				<a
					href="/"
					aria-label="Scaena, inicio"
					className="flex min-h-11 items-center rounded-md focus-visible:shadow-focus-ring focus-visible:outline-none"
				>
					<ScaenaBrand size={32} />
				</a>
			}
			items={[
				{ label: "Inicio", href: "/", current: path === "/" },
				{ label: "Vídeos", href: "/videos", current: path.startsWith("/videos") },
				...(studio
					? [
							{
								label: "Estudio",
								href: "/studio/overlays",
								current: true,
								children: STUDIO_PAGES.map((p) => ({
									label: p.label,
									href: p.href,
									current: studioPageOf(path)?.id === p.id,
								})),
							},
						]
					: []),
			]}
			search={<VideoSearch />}
			actions={
				<>
					<ThemeMenu />
					<VideoSearch className="hidden w-70 @5xl:block" />
				</>
			}
		/>
	);
}
