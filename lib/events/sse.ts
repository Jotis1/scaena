// Flujo SSE de eventos para los overlays (design.md, decisión 4; specs/obs-overlays, «Recuperación de la
// conexión»). Lee `channel:<id>:events` desde el último id cada segundo (el REST de Upstash no tiene lecturas
// bloqueantes) y manda cada entrada con `id:` igual al del stream. Se cierra solo antes del límite de la
// función; `EventSource` vuelve con `Last-Event-ID`, así que no se pierde nada ni se repite.
import { TOKEN_ROTATED } from "../overlay/token";
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";

/** Sin `Last-Event-ID` ni `since`, solo lo de los últimos 10 minutos. */
export const RECOVERY_MS = 10 * 60 * 1000;
/** Lo más atrás que se puede pedir con `since`: la retención del stream. */
export const MAX_REPLAY_MS = 24 * 60 * 60 * 1000;

export interface SseOptions {
	store: Store;
	channelId: string;
	/** Cabecera `Last-Event-ID` (o `null`). */
	lastEventId: string | null;
	/** Marca de tiempo desde la que reproducir (la meta, al conectar). */
	since?: number;
	/** ¿Sigue valiendo el token? Se mira de nuevo cuando llega el aviso de rotación. */
	stillAllowed: () => Promise<boolean>;
	/** Eventos que se mandan nada más conectar, sin `id` (los ajustes del canal). */
	initial?: () => Promise<{ event: string; data: string }[]>;
	signal?: AbortSignal;
	now?: () => number;
	pollMs?: number;
	heartbeatMs?: number;
	/** Cuánto vive el flujo antes de cerrarse para que el navegador reconecte. */
	maxMs?: number;
}

const STREAM_ID = /^\d+-\d+$/;

/** Primer id que ya no se manda: el `Last-Event-ID` si vale; si no, desde `since` o hace 10 min. */
export function startAfter(lastEventId: string | null, since: number | undefined, now: number): string {
	if (lastEventId && STREAM_ID.test(lastEventId)) return lastEventId;
	const from = since !== undefined ? Math.max(since, now - MAX_REPLAY_MS) : now - RECOVERY_MS;
	// `xrange` es exclusivo: con `<ms-1>-<máximo>` entra todo lo de `from` en adelante.
	return `${Math.max(0, from - 1)}-${Number.MAX_SAFE_INTEGER}`;
}

/** Una línea de SSE. `data` puede tener saltos de línea: cada uno va en su propia línea `data:`. */
export function sseMessage(m: { event?: string; id?: string; data: string }): string {
	let out = "";
	if (m.id) out += `id: ${m.id}\n`;
	if (m.event) out += `event: ${m.event}\n`;
	for (const line of m.data.split("\n")) out += `data: ${line}\n`;
	return `${out}\n`;
}

export function eventStream(o: SseOptions): ReadableStream<Uint8Array> {
	const now = o.now ?? Date.now;
	const pollMs = o.pollMs ?? 1000;
	const heartbeatMs = o.heartbeatMs ?? 15_000;
	const maxMs = o.maxMs ?? 240_000;
	const key = keys.channel(o.channelId, "events");
	const encoder = new TextEncoder();
	let cursor = startAfter(o.lastEventId, o.since, now());
	let closed = false;
	const timers: ReturnType<typeof setTimeout>[] = [];

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (s: string) => {
				if (!closed) controller.enqueue(encoder.encode(s));
			};
			const close = () => {
				if (closed) return;
				closed = true;
				for (const t of timers) clearTimeout(t);
				try {
					controller.close();
				} catch {}
			};
			o.signal?.addEventListener("abort", close, { once: true });

			// Si se corta, el navegador vuelve a los 2 s.
			send("retry: 2000\n\n");
			for (const m of (await o.initial?.()) ?? []) send(sseMessage(m));

			const started = now();
			const poll = async () => {
				if (closed) return;
				try {
					const entries = await o.store.xrange(key, cursor, 100);
					for (const e of entries) {
						cursor = e.id;
						if (e.fields.type === TOKEN_ROTATED) {
							if (!(await o.stillAllowed())) return close();
							continue;
						}
						send(sseMessage({ id: e.id, event: e.fields.type, data: e.fields.data ?? "{}" }));
					}
				} catch (error) {
					// Redis caído un momento: se reintenta en el siguiente ciclo, sin cortar el flujo.
					console.error(error);
				}
				if (now() - started >= maxMs) return close();
				timers.push(setTimeout(poll, pollMs));
			};
			const beat = () => {
				if (closed) return;
				send(": latido\n\n");
				timers.push(setTimeout(beat, heartbeatMs));
			};
			timers.push(setTimeout(beat, heartbeatMs));
			await poll();
		},
		cancel() {
			closed = true;
			for (const t of timers) clearTimeout(t);
		},
	});
}
