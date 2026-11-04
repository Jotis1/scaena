"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { LiveStatus } from "@/lib/twitch/status";
import { useLiveStatus } from "./useLiveStatus";

// Un solo sondeo de `/api/status` por página: el aviso de directo y «Dónde verlo» leen el mismo estado.
const Context = createContext<LiveStatus | null>(null);

export function LiveStatusProvider({ initial, children }: { initial: LiveStatus; children: ReactNode }) {
	const status = useLiveStatus(undefined, initial);
	return <Context.Provider value={status}>{children}</Context.Provider>;
}

export function useSiteStatus(): LiveStatus | null {
	return useContext(Context);
}
