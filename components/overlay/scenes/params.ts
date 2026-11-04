// Parámetros comunes de las escenas montadas (design.md, decisión 15).
import { GOAL_LABELS, GOAL_TYPES, type GoalType } from "@/lib/alerts/goal";
import { bool, date, int, oneOf, type SearchParams, text } from "@/lib/overlay/params";

export interface SceneOptions {
	token: string;
	chat: boolean;
	camera: boolean;
	events: boolean;
	goal: boolean;
	translucent: boolean;
	since?: number;
	goalProps: { type: GoalType; label: string; start: number; goal: number; unit?: string };
}

export function sceneOptions(q: SearchParams): SceneOptions {
	const type = oneOf(q, "type", GOAL_TYPES, "subs");
	const unit = text(q, "unit", "", 20);
	return {
		token: text(q, "token", "", 200),
		chat: bool(q, "chat", true),
		camera: bool(q, "camera", true),
		events: bool(q, "events", true),
		// `goal` es a la vez la pieza (`goal=0` la quita) y la cifra de la meta (`goal=300`).
		goal: int(q, "goal", 1, { min: 0 }) !== 0 && bool(q, "goal", true),
		translucent: bool(q, "translucent", true),
		since: date(q, "since")?.getTime(),
		goalProps: {
			type,
			label: text(q, "label", GOAL_LABELS[type], 40),
			start: int(q, "start", 0, { min: 0 }),
			goal: Math.max(1, int(q, "goal", 100, { min: 1 })),
			unit: unit || undefined,
		},
	};
}
