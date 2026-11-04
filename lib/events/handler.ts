// `GET /api/events?channel=<login>&token=<token>[&since=<ms>]` (design.md, decisión 4). Sin token válido
// responde 401 sin abrir el flujo, y el cliente no reintenta.
import { isValidToken } from "../overlay/token";
import type { Store } from "../storage/types";
import { eventStream, type SseOptions } from "./sse";

export interface EventsDeps {
	store: Store;
	/** Id de Twitch del canal a partir del login; `null` si el canal no es de Scaena. */
	channelId: (login: string) => Promise<string | null>;
	/** Eventos iniciales del canal (los ajustes de las alertas). */
	initial?: (channelId: string) => SseOptions["initial"];
	stream?: Partial<Pick<SseOptions, "pollMs" | "heartbeatMs" | "maxMs" | "now">>;
}

const plain = (status: number, text: string) =>
	new Response(text, {
		status,
		headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
	});

export async function handleEvents(request: Request, d: EventsDeps): Promise<Response> {
	const q = new URL(request.url).searchParams;
	const login = q.get("channel")?.trim().toLowerCase();
	if (!login) return plain(400, "Falta el canal (`channel`).");
	const channelId = await d.channelId(login);
	if (!channelId) return plain(404, `No hay ningún canal «${login}» en Scaena.`);

	const token = q.get("token");
	if (!(await isValidToken(d.store, channelId, token)))
		return plain(401, "El token no vale. Copia otra vez la URL desde el estudio.");

	const sinceRaw = q.get("since");
	const since = sinceRaw && /^\d+$/.test(sinceRaw) ? Number(sinceRaw) : undefined;

	const body = eventStream({
		store: d.store,
		channelId,
		// La cabecera la pone `EventSource` al reconectar solo; el parámetro, el cliente cuando crea uno nuevo.
		lastEventId: request.headers.get("last-event-id") ?? q.get("lastEventId"),
		since,
		stillAllowed: () => isValidToken(d.store, channelId, token),
		initial: d.initial?.(channelId),
		signal: request.signal,
		...d.stream,
	});
	return new Response(body, {
		headers: {
			"content-type": "text/event-stream; charset=utf-8",
			"cache-control": "no-store, no-transform",
			connection: "keep-alive",
			// Que ningún proxy guarde el flujo entero antes de soltarlo.
			"x-accel-buffering": "no",
		},
	});
}
