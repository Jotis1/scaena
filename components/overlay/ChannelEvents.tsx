"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { AlertPhrases } from "@/lib/alerts/phrase";
import { connectEvents, eventsUrl } from "@/lib/events/client";
import type { AlertEvent } from "@/lib/twitch/eventsub/event";

// Una sola conexión SSE por página (design.md, decisión 15): las piezas de una escena montada se suscriben a
// la misma. Sin token, o con uno que no vale, no hay conexión y las piezas de eventos no se pintan.

type Listener = (e: AlertEvent, id: string) => void;

interface ChannelEventsValue {
	/** `false` mientras no se sepa; `true` si hay token y el servidor no lo ha rechazado. */
	allowed: boolean;
	phrases: AlertPhrases | null;
	subscribe(l: Listener): () => void;
}

const Context = createContext<ChannelEventsValue | null>(null);

export function ChannelEventsProvider({
	channel,
	token,
	since,
	children,
}: {
	channel: string;
	token: string;
	since?: number;
	children: ReactNode;
}) {
	const listeners = useRef(new Set<Listener>());
	const [allowed, setAllowed] = useState(Boolean(token));
	const [phrases, setPhrases] = useState<AlertPhrases | null>(null);

	useEffect(() => {
		if (!token) return;
		const conn = connectEvents(eventsUrl(window.location.origin, { channel, token, since }), {
			onAlert: (e, id) => {
				for (const l of listeners.current) l(e, id);
			},
			onSettings: (s) => setPhrases(s.alerts),
			onUnauthorized: () => setAllowed(false),
		});
		return () => conn.close();
	}, [channel, token, since]);

	const subscribe = useCallback((l: Listener) => {
		listeners.current.add(l);
		return () => {
			listeners.current.delete(l);
		};
	}, []);
	const value = useMemo(() => ({ allowed, phrases, subscribe }), [allowed, phrases, subscribe]);
	return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useChannelEvents(): ChannelEventsValue {
	const v = useContext(Context);
	if (!v) throw new Error("useChannelEvents va dentro de <ChannelEventsProvider>.");
	return v;
}

/** Se suscribe a las alertas con un manejador que puede cambiar sin volver a suscribirse. */
export function useAlertListener(handler: Listener): void {
	const { subscribe } = useChannelEvents();
	const ref = useRef(handler);
	ref.current = handler;
	useEffect(() => subscribe((e, id) => ref.current(e, id)), [subscribe]);
}
