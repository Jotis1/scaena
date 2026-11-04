"use client";

import { StreamAlert } from "@jotis-me/react";
import { useEffect, useRef, useState } from "react";
import { fillPhrase } from "@/lib/alerts/phrase";
import { AlertQueue, type Showing } from "@/lib/alerts/queue";
import type { AlertEvent } from "@/lib/twitch/eventsub/event";
import { useAlertListener, useChannelEvents } from "./ChannelEvents";

/**
 * Al abrir la fuente, el flujo trae lo de los últimos minutos para que no se pierda nada tras un corte. Eso le
 * sirve a la lista de eventos; las alertas, en cambio, no repiten lo que ya salió antes de cargar la página.
 */
const STALE_MS = 60_000;

export interface LiveAlertsProps {
	/** Enseñar el mensaje del espectador (renovaciones y bits). */
	message: boolean;
	durationMs: number;
}

/** Overlay de alertas (specs/twitch-events, «Cola de alertas»): una cada vez, con la frase de su tipo. */
export function LiveAlerts({ message, durationMs }: LiveAlertsProps) {
	const { allowed, phrases } = useChannelEvents();
	const [showing, setShowing] = useState<Showing<AlertEvent> | null>(null);
	const queue = useRef<AlertQueue<AlertEvent> | null>(null);
	const mountedAt = useRef(Date.now());
	const seen = useRef(new Set<string>());

	useEffect(() => {
		const q = new AlertQueue<AlertEvent>(setShowing, durationMs);
		queue.current = q;
		return () => q.clear();
	}, [durationMs]);

	useAlertListener((e) => {
		if (seen.current.has(e.id) || e.ts < mountedAt.current - STALE_MS) return;
		seen.current.add(e.id);
		queue.current?.push(e);
	});

	if (!allowed || !showing) return null;
	const e = showing.item;
	// La frase se elige al pintar: si cambia en el estudio, la siguiente alerta ya sale con la nueva.
	const phrase = phrases?.[e.type];
	return (
		<StreamAlert
			key={e.id}
			type={e.type}
			user={e.user}
			amount={e.amount}
			months={e.months}
			tier={e.tier}
			message={message ? e.message : undefined}
			detail={phrase ? fillPhrase(phrase, e) : undefined}
			state={showing.state}
		/>
	);
}
