import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Estudio · Scaena", robots: { index: false } };

// Armazón del estudio (diseño: «Estudio»), con `SidebarNav`. La sesión se comprueba aquí y otra vez en cada
// página: `proxy.ts` solo mira que haya cookie.
export default async function StudioLayout({ children }: { children: ReactNode }) {
	const session = await requirePageSession();
	return (
		<div className="flex min-h-screen items-start">
			<StudioSidebar name={session.name} />
			<div className="flex min-w-0 flex-1 flex-col">
				<StudioTopBar />
				<main className="flex max-w-280 flex-col gap-6 p-8">{children}</main>
			</div>
		</div>
	);
}
