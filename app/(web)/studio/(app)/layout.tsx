import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Estudio · Scaena", robots: { index: false } };

// Armazón del estudio (diseño: «Overlays», «Recursos» y «Conexión»): `SidebarNav` y, en cada página, su `PageHeader`
// con el botón de tema. La sesión se comprueba aquí y otra vez en cada página: `proxy.ts` solo mira que haya cookie.
export default async function StudioLayout({ children }: { children: ReactNode }) {
	const session = await requirePageSession();
	return (
		<div className="flex min-h-screen flex-col lg:flex-row lg:items-start">
			<StudioSidebar name={session.name} />
			{/* El contenido, centrado en el espacio a la derecha de la barra lateral, no en la ventana (design.md, decisión 6). */}
			<div className="flex w-full min-w-0 flex-1">
				<main className="mx-auto flex w-full max-w-295 min-w-0 flex-col gap-8 px-4 pt-8 pb-16 md:px-8 xl:px-10">
					{children}
				</main>
			</div>
		</div>
	);
}
