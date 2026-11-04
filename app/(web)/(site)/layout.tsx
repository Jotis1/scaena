import type { ReactNode } from "react";
import { LiveStatusProvider } from "@/components/live/LiveStatusProvider";
import { LiveBanner } from "@/components/web/LiveBanner";
import { SiteFooter } from "@/components/web/SiteFooter";
import { SiteHeader } from "@/components/web/SiteHeader";
import { getMainProfile } from "@/lib/profile";
import { siteStatus } from "@/lib/site";

// Web pública: cabecera, aviso de directo, contenido y pie (diseño: «Portada» y «Vídeos»). El estado del
// directo se lee en el servidor para el primer pintado y luego se sondea en el cliente cada 30 s.
export default async function SiteLayout({ children }: { children: ReactNode }) {
	const profile = getMainProfile();
	const status = await siteStatus();
	return (
		<LiveStatusProvider initial={status}>
			<div className="flex min-h-screen flex-col">
				<SiteHeader />
				<LiveBanner login={profile.twitch.login} />
				<main className="flex-auto">{children}</main>
				<SiteFooter />
			</div>
		</LiveStatusProvider>
	);
}
