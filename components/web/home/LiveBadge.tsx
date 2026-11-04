"use client";

import { Badge } from "@jotis-me/react";
import { useSiteStatus } from "@/components/live/LiveStatusProvider";

/** Estado en «Dónde verlo»: en directo con el acento de marca, nunca en rojo (design.md, decisión 12). */
export function LiveBadge() {
	const status = useSiteStatus();
	return status?.live ? (
		<Badge color="brand" type="pill" size="md" dot>
			En directo ahora
		</Badge>
	) : (
		<Badge color="gray" type="pill" size="md" dot>
			Ahora mismo, sin directo
		</Badge>
	);
}
