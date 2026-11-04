"use client";

import { StreamStatus } from "@jotis-me/react";
import { useLiveStatus, useNow } from "@/components/live/useLiveStatus";
import { uptime } from "@/lib/uptime";

/**
 * Overlay de estado (specs/live-status, «Overlay de estado»): «En directo», tiempo en emisión y categoría; los
 * espectadores solo si se piden. Se actualiza solo, sin recargar la fuente.
 */
export function LiveStatusPill({ channel, viewers }: { channel: string; viewers: boolean }) {
	const status = useLiveStatus(channel);
	const now = useNow(Boolean(status?.live));
	if (!status) return null;
	if (!status.live) return <StreamStatus status="offline" />;
	return (
		<StreamStatus
			status="live"
			uptime={uptime(status.startedAt, now)}
			category={status.category}
			viewers={viewers ? status.viewers : undefined}
		/>
	);
}
