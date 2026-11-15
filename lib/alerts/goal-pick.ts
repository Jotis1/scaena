// Lo que pinta un overlay de meta y cómo elige la que toca en la rotación (design.md del cambio
// goal-selector-and-rotation, decisión 4). Sin nada de servidor: lo usan el overlay y el estudio.
import type { GoalState } from "./saved-goal";

/** Nombre del evento SSE con la vista de la meta. */
export const GOAL_VIEW_EVENT = "goal-view";

export type GoalView =
	| { kind: "one"; goal: GoalState }
	| {
			kind: "rotate";
			/** Segundos que sale cada meta. */
			every: number;
			goals: GoalState[];
			/** Hora del servidor al calcularla (ms), para que todas las fuentes cuenten con el mismo reloj. */
			serverNow: number;
	  };

/**
 * La meta que toca ahora. En la rotación sale del reloj de época, no de cuándo se abrió la fuente: así la pieza, las
 * escenas y el estudio enseñan la misma a la vez. `offset` corrige el reloj local con el del servidor.
 */
export function pickGoal(view: GoalView, now: number, offset = 0): GoalState {
	if (view.kind === "one") return view.goal;
	const turn = Math.floor((now + offset) / (view.every * 1000));
	return view.goals[((turn % view.goals.length) + view.goals.length) % view.goals.length] as GoalState;
}

/** Cuánto hay que sumar al reloj local para tener el del servidor. */
export const clockOffset = (view: GoalView, localNow: number) =>
	view.kind === "rotate" ? view.serverNow - localNow : 0;

/** Un valor que llega por el SSE: la vista, o `null` si no lo parece. */
export function parseGoalView(v: unknown): GoalView | null {
	if (!v || typeof v !== "object") return null;
	const o = v as Partial<GoalView> & Record<string, unknown>;
	if (o.kind === "one" && o.goal && typeof o.goal === "object") return o as GoalView;
	if (
		o.kind === "rotate" &&
		Array.isArray(o.goals) &&
		o.goals.length > 0 &&
		typeof o.every === "number" &&
		o.every > 0 &&
		typeof o.serverNow === "number"
	)
		return o as GoalView;
	return null;
}
