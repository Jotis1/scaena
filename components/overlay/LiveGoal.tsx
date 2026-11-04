"use client";

import { StreamGoal } from "@jotis-me/react";
import { useRef, useState } from "react";
import { type GoalType, goalIncrement } from "@/lib/alerts/goal";
import { useAlertListener, useChannelEvents } from "./ChannelEvents";

export interface LiveGoalProps {
	type: GoalType;
	label: string;
	start: number;
	goal: number;
	unit?: string;
	width?: number;
}

/**
 * Meta (design.md, decisión 5). La cuenta sale de `start` más lo que ha llegado desde `since`, que el flujo
 * reproduce al conectar: recargar la fuente no pierde la cuenta.
 */
export function LiveGoal({ type, label, start, goal, unit, width = 420 }: LiveGoalProps) {
	const { allowed } = useChannelEvents();
	const [current, setCurrent] = useState(start);
	const counted = useRef(new Set<string>());

	useAlertListener((e) => {
		if (counted.current.has(e.id)) return;
		counted.current.add(e.id);
		const n = goalIncrement(type, e);
		if (n) setCurrent((c) => c + n);
	});

	if (!allowed) return null;
	return <StreamGoal label={label} current={current} goal={goal} unit={unit} width={width} />;
}
