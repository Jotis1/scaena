// Parámetros comunes de las escenas montadas (design.md, decisión 15).
import { GOAL_LABELS, GOAL_TYPES, type GoalType } from "@/lib/alerts/goal";
import { bool, date, int, oneOf, optionalInt, type SearchParams, text } from "@/lib/overlay/params";

export interface SceneOptions {
	token: string;
	chat: boolean;
	camera: boolean;
	events: boolean;
	goal: boolean;
	translucent: boolean;
	/** Opciones de cada pieza, con los mismos nombres que la pieza suelta (specs/obs-overlays, «Opciones de cada pieza
	 * en las escenas»). */
	animate: boolean;
	message: boolean;
	/** Filas de eventos; sin ellas, las de la escena (`SCENE_ROWS`). */
	rows?: number;
	viewers: boolean;
	/** Nombre del marco de cámara; sin él, el del perfil. */
	cameraName?: string;
	since?: number;
	goalProps: { type: GoalType; label: string; start: number; goal: number; unit?: string };
}

/** Filas de eventos de cada escena montada si la URL no trae `rows`. */
export const SCENE_ROWS = { game: 4, chatting: 2 } as const;

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
		animate: bool(q, "animate", true),
		message: bool(q, "message", true),
		rows: optionalInt(q, "rows", { min: 1, max: 10 }),
		viewers: bool(q, "viewers", false),
		cameraName: text(q, "name", "", 40) || undefined,
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
