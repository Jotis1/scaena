import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConnectionUnreachable, ConnectionView } from "@/components/studio/ConnectionView";
import { ScopeNotice } from "@/components/studio/ScopeNotice";
import { StudioContent, StudioPageHeader } from "@/components/studio/StudioContent";
import { requirePageSession } from "@/lib/studio/session";
import { type ConnectionStatus, connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps, missingScopesFor } from "@/lib/twitch/server";
import { connectEvents, disconnectEvents } from "./actions";

export const metadata: Metadata = { title: "Conexión · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Conexión con Twitch (diseño: «Conexión», sin conectar, conectado, revocada y error con Twitch; specs/twitch-events).
export default async function ConnectionPage() {
	const session = await requirePageSession();
	// Los permisos se preguntan a Twitch a la vez que las suscripciones; si Twitch no contesta, no hay aviso.
	const [status, missing] = await Promise.all([
		connectionStatus(eventSubDeps(), session.channelId).catch((e): ConnectionStatus | null => {
			console.error(e);
			return null;
		}),
		missingScopesFor(await headers()),
	]);

	return (
		<StudioContent>
			<StudioPageHeader
				title="Conexión"
				description="Lo que Twitch le cuenta a Scaena: quién sigue, quién se suscribe, quién llega con una raid. Sin esto, los overlays se quedan callados."
			/>
			<ScopeNotice missing={missing} />
			{status ? (
				<ConnectionView
					status={status}
					name={session.name}
					image={session.image}
					connect={connectEvents}
					disconnect={disconnectEvents}
				/>
			) : (
				<ConnectionUnreachable
					name={session.name}
					image={session.image}
					disconnect={disconnectEvents}
				/>
			)}
		</StudioContent>
	);
}
