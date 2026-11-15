import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioSections } from "@/components/studio/StudioSections";
import { SiteHeader } from "@/components/web/SiteHeader";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Estudio · Scaena", robots: { index: false } };

// Armazón del estudio (diseño: «Navegación del Studio»; specs/channel-site, «Navegación del estudio»): la cabecera de
// la web con «Estudio» y, debajo, la barra de secciones con la cuenta. Sin barra lateral. Cada página pone su franja
// de aviso (si va) y su contenido de 1280 px (`StudioContent`). La sesión se comprueba aquí y otra vez en cada
// página: `proxy.ts` solo mira que haya cookie.
export default async function StudioLayout({ children }: { children: ReactNode }) {
	const session = await requirePageSession();
	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader studio />
			<StudioSections name={session.name} />
			<main className="flex w-full min-w-0 flex-auto flex-col">{children}</main>
		</div>
	);
}
