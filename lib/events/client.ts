// Cliente de eventos del navegador (design.md, decisión 4). `EventSource` reconecta solo cuando el servidor
// cierra el flujo (cada 4 min) o se corta la red. Si el servidor responde con error, `EventSource` se rinde: aquí
// se mira por qué. Con 401 (token que no vale) no se reintenta nunca y la página queda transparente; con
// cualquier otro fallo se vuelve a intentar con espera creciente, desde el último id recibido.

import type { AlertPhrases } from "../alerts/phrase";
import type { AlertEvent } from "../twitch/eventsub/event";

export interface EventsHandlers {
	onAlert?: (e: AlertEvent, id: string) => void;
	onSettings?: (s: { alerts: AlertPhrases }) => void;
	/** El token no vale: no habrá más intentos. */
	onUnauthorized?: () => void;
}

export interface EventsConnection {
	close(): void;
}

const MAX_BACKOFF_MS = 15_000;

export function eventsUrl(base: string, q: { channel: string; token: string; since?: number }): string {
	const u = new URL("/api/events", base);
	u.searchParams.set("channel", q.channel);
	u.searchParams.set("token", q.token);
	if (q.since !== undefined) u.searchParams.set("since", String(q.since));
	return u.toString();
}

export function connectEvents(
	url: string,
	h: EventsHandlers,
	deps: { EventSource?: typeof EventSource; fetch?: typeof fetch } = {},
): EventsConnection {
	const ES = deps.EventSource ?? EventSource;
	const f = deps.fetch ?? fetch;
	let source: EventSource | undefined;
	let lastId: string | undefined;
	let closed = false;
	let backoff = 1000;
	let retry: ReturnType<typeof setTimeout> | undefined;

	const open = () => {
		if (closed) return;
		const u = new URL(url);
		if (lastId) u.searchParams.set("lastEventId", lastId);
		const es = new ES(u.toString());
		source = es;
		es.addEventListener("open", () => {
			backoff = 1000;
		});
		es.addEventListener("alert", (m) => {
			const msg = m as MessageEvent<string>;
			lastId = msg.lastEventId || lastId;
			try {
				h.onAlert?.(JSON.parse(msg.data) as AlertEvent, msg.lastEventId);
			} catch {}
		});
		es.addEventListener("settings", (m) => {
			const msg = m as MessageEvent<string>;
			if (msg.lastEventId) lastId = msg.lastEventId;
			try {
				h.onSettings?.(JSON.parse(msg.data));
			} catch {}
		});
		es.addEventListener("error", () => {
			// CONNECTING: `EventSource` ya está reconectando por su cuenta.
			if (es.readyState !== ES.CLOSED || closed) return;
			void diagnose(u.toString());
		});
	};

	const diagnose = async (u: string) => {
		let status = 0;
		const abort = new AbortController();
		try {
			status = (await f(u, { signal: abort.signal })).status;
		} catch {}
		abort.abort();
		if (closed) return;
		if (status === 401) {
			closed = true;
			h.onUnauthorized?.();
			return;
		}
		retry = setTimeout(open, backoff);
		backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
	};

	open();
	return {
		close() {
			closed = true;
			if (retry) clearTimeout(retry);
			source?.close();
		},
	};
}
