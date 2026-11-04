"use client";

import { useEffect, useState } from "react";
import type { LiveStatus } from "@/lib/twitch/status";

/** Cada cuánto se pregunta: la CDN guarda `/api/status` 30 s (design.md, decisión 6). */
export const STATUS_POLL_MS = 30_000;

/**
 * Estado del directo, sondeado cada 30 s. `null` hasta la primera respuesta. Si una consulta falla, se queda
 * con lo último que supo: ni la web ni el overlay se vacían por un fallo puntual.
 */
export function useLiveStatus(channel?: string, initial: LiveStatus | null = null): LiveStatus | null {
	const [status, setStatus] = useState<LiveStatus | null>(initial);
	useEffect(() => {
		let alive = true;
		const url = channel ? `/api/status?channel=${encodeURIComponent(channel)}` : "/api/status";
		const load = async () => {
			try {
				const res = await fetch(url);
				if (res.ok && alive) setStatus((await res.json()) as LiveStatus);
			} catch {}
		};
		void load();
		const t = setInterval(load, STATUS_POLL_MS);
		return () => {
			alive = false;
			clearInterval(t);
		};
	}, [channel]);
	return status;
}

/** Un valor que cambia cada segundo, para el reloj del tiempo en emisión. */
export function useNow(active: boolean): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!active) return;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [active]);
	return now;
}
