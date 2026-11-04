import type { Page, Route } from "@playwright/test";

// Flujo SSE falso para los overlays: intercepta `/api/events` en el navegador. Cada conexión recibe lo que
// devuelva `respond` y se cierra, así que `EventSource` vuelve a conectar como lo haría al cerrarse el de verdad.

export interface FakeEvent {
	id?: string;
	event: "alert" | "settings";
	data: object;
}

export const PHRASES = {
	follow: "Gracias por seguir el canal.",
	sub: "Gracias por suscribirte.",
	resub: "{meses} meses ya. Gracias por seguir aquí.",
	gift: "Ha regalado {cantidad} subs al chat. Gracias.",
	raid: "Llega con {espectadores} personas. Bienvenidas.",
	bits: "{bits} bits. Muchas gracias.",
};

let n = 0;
/** Evento de alerta con lo mínimo; `ts` por defecto, ahora. */
export function alert(data: Record<string, unknown>): FakeEvent {
	n++;
	const id = `${Date.now()}-${n}`;
	return {
		id,
		event: "alert",
		data: { id: `msg-${n}`, channelId: "1", user: "Ana", ts: Date.now(), ...data },
	};
}

export const settings = (alerts: Record<string, string> = PHRASES): FakeEvent => ({
	event: "settings",
	data: { alerts: { ...PHRASES, ...alerts } },
});

const body = (events: FakeEvent[]) =>
	`retry: 300\n\n${events
		.map((e) => `${e.id ? `id: ${e.id}\n` : ""}event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
		.join("")}`;

export interface SseRequest {
	url: URL;
	lastEventId: string | null;
	/** Número de conexión, desde 1. */
	n: number;
}

export async function fakeEvents(
	page: Page,
	respond: (r: SseRequest) => FakeEvent[] | { status: number },
): Promise<SseRequest[]> {
	const requests: SseRequest[] = [];
	await page.route("**/api/events?**", async (route: Route) => {
		const url = new URL(route.request().url());
		const r: SseRequest = {
			url,
			lastEventId:
				(await route.request().allHeaders())["last-event-id"] ?? url.searchParams.get("lastEventId"),
			n: requests.length + 1,
		};
		requests.push(r);
		const out = respond(r);
		if ("status" in out) return route.fulfill({ status: out.status, body: "no" });
		return route.fulfill({
			status: 200,
			headers: { "content-type": "text/event-stream", "cache-control": "no-store" },
			body: body(out),
		});
	});
	return requests;
}
