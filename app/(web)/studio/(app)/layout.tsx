import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { SiteHeader } from "@/components/web/SiteHeader";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Estudio · Scaena", robots: { index: false } };

// Armazón del estudio (specs/channel-site, «Navegación del estudio»): la cabecera de la web con «Estudio» y la cuenta,
// y debajo la barra lateral de secciones y el contenido. Una sola barra horizontal. Cada página pone su franja de
// aviso (si va) y su contenido (`StudioContent`). La sesión se comprueba aquí y otra vez en cada página: `proxy.ts`
// solo mira que haya cookie.
export default async function StudioLayout({ children }: { children: ReactNode }) {
	const session = await requirePageSession();
	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader account={{ name: session.name, image: session.image }} />
			<div className="flex min-w-0 flex-auto flex-col lg:flex-row">
				{/* La barra lateral llega hasta abajo: en escritorio, la columna la estira. */}
				<div className="flex shrink-0 flex-col max-lg:w-full [&>nav]:flex-1">
					<StudioSidebar />
				</div>
				<main className="flex w-full min-w-0 flex-auto flex-col">{children}</main>
			</div>
		</div>
	);
}
