// Lo que suma cada evento a una meta (design.md, decisión 5; specs/twitch-events, «Eventos recientes y metas»).
import type { AlertEvent } from "../twitch/eventsub/event";

export const GOAL_TYPES = ["subs", "follows", "bits"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

/** Texto por defecto de cada meta, si la URL no trae `label`. */
export const GOAL_LABELS: Record<GoalType, string> = {
	subs: "Meta de subs",
	follows: "Meta de seguidores",
	bits: "Meta de bits",
};

/** Unidad de cada meta, si no se da otra: «64 / 100 subs». */
export const GOAL_UNITS: Record<GoalType, string> = { subs: "subs", follows: "seguidores", bits: "bits" };

/**
 * Subs: las nuevas y las regaladas (cada regalo, su cantidad). Las renovaciones no: ya contaban. Seguidores: uno
 * por follow. Bits: los que lleguen. Las alertas de prueba del estudio no suman, para que probar no mueva la meta.
 */
export function goalIncrement(type: GoalType, e: AlertEvent): number {
	if (e.test) return 0;
	if (type === "subs") return e.type === "sub" ? 1 : e.type === "gift" ? (e.amount ?? 1) : 0;
	if (type === "follows") return e.type === "follow" ? 1 : 0;
	return e.type === "bits" ? (e.amount ?? 0) : 0;
}

/** La unidad que se pinta: la dada o la del tipo. */
export const goalUnit = (g: { type: GoalType; unit?: string }) => g.unit || GOAL_UNITS[g.type];
