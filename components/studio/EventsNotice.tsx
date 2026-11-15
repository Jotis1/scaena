import { Alert, Button } from "@jotis-me/react";
import { AlertTriangle, ArrowRight } from "@untitledui/icons";
import { eventsNotice } from "@/lib/studio/connection";
import { connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";

type Notice = NonNullable<ReturnType<typeof eventsNotice>>;

/**
 * Aviso de Overlays, Guía y Recursos cuando los eventos de Twitch no llegan del todo, con el camino a la página de
 * conexión (specs/twitch-events, «Aviso de eventos sin conectar»). Si Twitch no responde no se enseña nada: un fallo
 * puntual no tiene que parecer una desconexión.
 */
export async function EventsNotice({ channelId }: { channelId: string }) {
	let notice: Notice | null = null;
	try {
		notice = eventsNotice((await connectionStatus(eventSubDeps(), channelId)).rows);
	} catch (error) {
		console.error(error);
	}
	return notice ? <EventsBand notice={notice} /> : null;
}

/**
 * La franja del aviso: a todo el ancho, justo bajo la navegación y antes del título de la página (design.md del cambio
 * redesign-studio, decisión 3). El botón es secundario: cada página tiene su propia acción principal.
 */
export function EventsBand({ notice }: { notice: Notice }) {
	return (
		<div className="border-b border-secondary" data-band="events">
			<div className="mx-auto max-w-320 px-[min(32px,4.2%)] py-4">
				<Alert
					color="warning"
					icon={AlertTriangle}
					title={notice.title}
					description={notice.description}
					actions={
						<Button
							hierarchy="secondary"
							size="sm"
							href="/studio/connection"
							iconTrailing={ArrowRight}
						>
							{notice.action}
						</Button>
					}
				/>
			</div>
		</div>
	);
}
