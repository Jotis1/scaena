import { Alert, Button } from "@jotis-me/react";
import { eventsNotice } from "@/lib/studio/connection";
import { connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";

/**
 * Aviso arriba de Overlays y Recursos cuando los eventos de Twitch no llegan del todo, con el camino a la página
 * de conexión. Si Twitch no responde no se enseña nada: un fallo puntual no tiene que parecer una desconexión.
 * El botón es secundario: cada página ya tiene (o puede tener) su acción principal.
 */
export async function EventsNotice({ channelId }: { channelId: string }) {
	let notice: ReturnType<typeof eventsNotice> = null;
	try {
		notice = eventsNotice((await connectionStatus(eventSubDeps(), channelId)).rows);
	} catch (error) {
		console.error(error);
	}
	if (!notice) return null;
	return (
		<Alert
			color="warning"
			icon="alert-triangle"
			title={notice.title}
			description={notice.description}
			actions={
				<Button hierarchy="secondary" size="sm" href="/studio/connection" iconTrailing="arrow-right">
					{notice.action}
				</Button>
			}
		/>
	);
}
