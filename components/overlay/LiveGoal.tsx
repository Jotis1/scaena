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
 * Meta. Con una meta guardada en el estudio, pinta la que manda el servidor, con su cuenta: no suma nada por su
 * cuenta, así que reconectar o tener varias abiertas no duplica (specs/twitch-events, «Eventos recientes y metas»).
 * Sin meta guardada, como hasta ahora: la de la URL, desde `start` más lo que ha llegado desde `since`.
 */
export function LiveGoal({ type, label, start, goal, unit, width = 420 }: LiveGoalProps) {
	const { allowed, goal: saved } = useChannelEvents();
	const [current, setCurrent] = useState(start);
	const counted = useRef(new Set<string>());

	useAlertListener((e) => {
		if (counted.current.has(e.id)) return;
		counted.current.add(e.id);
		const n = goalIncrement(type, e);
		if (n) setCurrent((c) => c + n);
	});

	if (!allowed) return null;
	if (saved)
		return (
			<StreamGoal
				label={saved.label}
				current={saved.current}
				goal={saved.target}
				unit={saved.unit || undefined}
				width={width}
			/>
		);
	return <StreamGoal label={label} current={current} goal={goal} unit={unit} width={width} />;
}
