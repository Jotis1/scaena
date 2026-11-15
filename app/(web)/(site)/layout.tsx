import { headers } from "next/headers";
import type { ReactNode } from "react";
import { LiveStatusProvider } from "@/components/live/LiveStatusProvider";
import { LiveBanner } from "@/components/web/LiveBanner";
import { SiteFooter } from "@/components/web/SiteFooter";
import { SiteHeader } from "@/components/web/SiteHeader";
import { loadMainProfile } from "@/lib/profile";
import { siteStatus } from "@/lib/site";
import { readSession } from "@/lib/studio/session";

// Web pública: cabecera (con la cuenta si hay sesión del estudio), aviso de directo, contenido y pie (diseño:
// «Portada» y «Vídeos»). El estado del
// directo se lee en el servidor para el primer pintado y luego se sondea en el cliente cada 30 s.
export default async function SiteLayout({ children }: { children: ReactNode }) {
	const profile = await loadMainProfile();
	const [status, session] = await Promise.all([siteStatus(), readSession(await headers())]);
	return (
		<LiveStatusProvider initial={status}>
			<div className="flex min-h-screen flex-col">
				<SiteHeader account={session ? { name: session.name, image: session.image } : undefined} />
				<LiveBanner login={profile.twitch.login} />
				<main className="flex-auto">{children}</main>
				<SiteFooter signedIn={Boolean(session)} />
			</div>
		</LiveStatusProvider>
	);
}
