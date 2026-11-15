"use client";

import { StreamGoal } from "@jotis-me/react";
import { useEffect, useRef, useState } from "react";
import { type GoalType, goalIncrement, goalUnit } from "@/lib/alerts/goal";
import { type GoalView, pickGoal } from "@/lib/alerts/goal-pick";
import { useAlertListener, useChannelEvents } from "./ChannelEvents";

export interface LiveGoalProps {
	type: GoalType;
	label: string;
	start: number;
	goal: number;
	unit?: string;
	width?: number;
	/** Fundido al pasar a otra meta en la rotación. Sin él, o con «reducir movimiento», cambia de golpe. */
	animate?: boolean;
}

/**
 * La meta que toca ahora de una vista: la fija, o la del turno en la rotación. Mira el reloj cada segundo y solo
 * cambia al cambiar de turno (design.md del cambio goal-selector-and-rotation, decisión 4).
 */
export function useCurrentGoal(view: GoalView | null, offset = 0) {
	const [now, setNow] = useState(() => Date.now());
	const rotating = view?.kind === "rotate";
	useEffect(() => {
		if (!rotating) return;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [rotating]);
	return view ? pickGoal(view, now, offset) : null;
}

/**
 * Meta. Con metas guardadas en el estudio, pinta la que sale según el servidor, con su cuenta: no suma nada por su
 * cuenta, así que reconectar o tener varias abiertas no duplica (specs/twitch-events, «Eventos recientes y metas»).
 * Sin metas guardadas, como hasta ahora: la de la URL, desde `start` más lo que ha llegado desde `since`.
 */
export function LiveGoal({ type, label, start, goal, unit, width = 420, animate = true }: LiveGoalProps) {
	const { allowed, goal: saved } = useChannelEvents();
	const [current, setCurrent] = useState(start);
	const counted = useRef(new Set<string>());
	const shown = useCurrentGoal(saved?.view ?? null, saved?.offset);
	const box = useRef<HTMLDivElement>(null);
	const lastRef = useRef<string | undefined>(undefined);

	useAlertListener((e) => {
		if (counted.current.has(e.id)) return;
		counted.current.add(e.id);
		const n = goalIncrement(type, e);
		if (n) setCurrent((c) => c + n);
	});

	// Fundido al pasar a otra meta (specs/obs-overlays, «Rotación de metas»); la primera vez no.
	const ref = shown?.ref;
	useEffect(() => {
		const before = lastRef.current;
		lastRef.current = ref;
		if (!before || !ref || before === ref || !animate) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		box.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
	}, [ref, animate]);

	if (!allowed) return null;
	if (shown)
		return (
			<div ref={box} data-goal={shown.ref}>
				<StreamGoal
					label={shown.label}
					current={shown.current}
					goal={shown.target}
					unit={goalUnit(shown)}
					width={width}
				/>
			</div>
		);
	return (
		<StreamGoal
			label={label}
			current={current}
			goal={goal}
			unit={goalUnit({ type, unit })}
			width={width}
		/>
	);
}
