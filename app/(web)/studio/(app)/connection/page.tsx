import { Alert, PageHeader } from "@jotis-me/react";
import type { Metadata } from "next";
import { ConnectionView } from "@/components/studio/ConnectionView";
import { ThemeMenu } from "@/components/web/ThemeMenu";
import { requirePageSession } from "@/lib/studio/session";
import { type ConnectionStatus, connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";
import { connectEvents, disconnectEvents } from "./actions";

export const metadata: Metadata = { title: "Conexión · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Conexión con Twitch (diseño: «Conexión», sin conectar, conectado y revocada; specs/twitch-events).
export default async function ConnectionPage() {
	const session = await requirePageSession();
	let status: ConnectionStatus | null = null;
	try {
		status = await connectionStatus(eventSubDeps(), session.channelId);
	} catch (e) {
		console.error(e);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Conexión con Twitch"
				description="Con ella, Scaena recibe los eventos del canal (follows, subs, raids, bits) y se los pasa a los overlays."
				divider={false}
				actions={<ThemeMenu />}
			/>
			{status ? (
				<ConnectionView
					status={status}
					name={session.name}
					connect={connectEvents}
					disconnect={disconnectEvents}
				/>
			) : (
				<Unreachable />
			)}
		</div>
	);
}

function Unreachable() {
	return (
		<Alert
			color="error"
			title="No se ha podido leer el estado en Twitch"
			description="Twitch no ha respondido o ha rechazado las credenciales de la app. Comprueba TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET y recarga la página."
		/>
	);
}
