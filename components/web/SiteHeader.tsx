"use client";

import { HeaderNav } from "@jotis-me/react";
import { usePathname } from "next/navigation";
import { AccountMenu, type HeaderAccount } from "./AccountMenu";
import { ScaenaBrand } from "./ScaenaBrand";
import { ThemeMenu } from "./ThemeMenu";
import { VideoSearch } from "./VideoSearch";

/**
 * Cabecera de la web y del estudio con el `HeaderNav` de Regula: subrayada y a todo el ancho, con la marca, «Inicio»,
 * «Vídeos» y «Estudio» (la página actual subrayada) y, a la derecha, el tema o la cuenta y el buscador
 * (specs/channel-site, «Diseño de la suite», «Entrada al estudio desde la web» y «Menú de la cuenta»). Por debajo de
 * 1024 px de cabecera, la navegación va en el menú: el tema o la cuenta siguen en la fila de arriba (`mobileActions`)
 * y el buscador pasa al panel del menú (`search`).
 *
 * «Estudio» lleva a Overlays con sesión y a la entrada sin ella. Las secciones del estudio van en su barra lateral,
 * no aquí.
 */
export function SiteHeader({ account }: { account?: HeaderAccount }) {
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
				{
					label: "Estudio",
					href: account ? "/studio/overlays" : "/studio/login",
					current: path.startsWith("/studio"),
				},
			]}
			search={<VideoSearch />}
			actions={
				<>
					{account ? <AccountMenu account={account} /> : <ThemeMenu />}
					<VideoSearch className="hidden w-70 @5xl:block" />
				</>
			}
		/>
	);
}
