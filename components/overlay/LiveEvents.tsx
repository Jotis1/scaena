"use client";

import { type StreamEventItem, StreamEvents } from "@jotis-me/react";
import { useEffect, useState } from "react";
import { formatTimeAgo } from "@/lib/format";
import type { AlertEvent } from "@/lib/twitch/eventsub/event";
import { useAlertListener, useChannelEvents } from "./ChannelEvents";

export interface LiveEventsProps {
	rows: number;
	animate: boolean;
	width?: number;
}

/** Overlay de eventos recientes: del más nuevo al más antiguo, con el id del evento como clave estable. */
export function LiveEvents({ rows, animate, width = 360 }: LiveEventsProps) {
	const { allowed } = useChannelEvents();
	const [events, setEvents] = useState<AlertEvent[]>([]);
	const [now, setNow] = useState(() => Date.now());

	useAlertListener((e) => {
		setEvents((list) => (list.some((x) => x.id === e.id) ? list : [e, ...list].slice(0, 20)));
	});

	// «hace 3 min» se actualiza solo.
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(t);
	}, []);

	if (!allowed) return null;
	const items: StreamEventItem[] = events.map((e) => ({
		id: e.id,
		type: e.type,
		user: e.user,
		amount: e.amount,
		months: e.months,
		time: formatTimeAgo(e.ts, now),
	}));
	return <StreamEvents items={items} max={rows} animate={animate} width={width} />;
}
