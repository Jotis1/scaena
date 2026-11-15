import type { Metadata } from "next";
import { ConnectionUnreachable, ConnectionView } from "@/components/studio/ConnectionView";
import { StudioContent, StudioPageHeader } from "@/components/studio/StudioContent";
import { requirePageSession } from "@/lib/studio/session";
import { type ConnectionStatus, connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";
import { connectEvents, disconnectEvents } from "./actions";

export const metadata: Metadata = { title: "Conexión · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Conexión con Twitch (diseño: «Conexión», sin conectar, conectado, revocada y error con Twitch; specs/twitch-events).
export default async function ConnectionPage() {
	const session = await requirePageSession();
	let status: ConnectionStatus | null = null;
	try {
		status = await connectionStatus(eventSubDeps(), session.channelId);
	} catch (e) {
		console.error(e);
	}

	return (
		<StudioContent>
			<StudioPageHeader
				title="Conexión"
				description="Lo que Twitch le cuenta a Scaena: quién sigue, quién se suscribe, quién llega con una raid. Sin esto, los overlays se quedan callados."
			/>
			{status ? (
				<ConnectionView
					status={status}
					name={session.name}
					connect={connectEvents}
					disconnect={disconnectEvents}
				/>
			) : (
				<ConnectionUnreachable name={session.name} disconnect={disconnectEvents} />
			)}
		</StudioContent>
	);
}
