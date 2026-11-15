// Relleno de las frases de alerta (design.md, decisión 9; specs/obs-overlays, «Frases de alerta editables»).
// Sin dependencias de servidor: lo usan el overlay de alertas y la vista previa del estudio. El resultado es
// texto plano y llega a `StreamAlert` como `detail`, que es un `string`: un `<b>` se ve tal cual.
import { formatNumber } from "@jotis-me/react";
import type { AlertEvent, AlertType } from "../twitch/eventsub/event";

export type AlertPhrases = Record<AlertType, string>;

/** Valor de cada hueco para un evento; los que no tocan a ese tipo quedan vacíos. */
function values(e: Pick<AlertEvent, "type" | "amount" | "months">): Record<string, string> {
	const n = (v: number | undefined) => (v === undefined ? "" : formatNumber(v));
	return {
		meses: n(e.months),
		cantidad: e.type === "gift" ? n(e.amount) : "",
		espectadores: e.type === "raid" ? n(e.amount) : "",
		bits: e.type === "bits" ? n(e.amount) : "",
	};
}

export function fillPhrase(phrase: string, e: Pick<AlertEvent, "type" | "amount" | "months">): string {
	const v = values(e);
	return phrase
		.replace(/\{(meses|cantidad|espectadores|bits)\}/g, (_, name: string) => v[name] ?? "")
		.replace(/\s{2,}/g, " ")
		.trim();
}

/** Huecos que admite la frase de cada alerta (specs/obs-overlays, «Frases de alerta editables»). */
export const PHRASE_HOLES: Record<AlertType, readonly string[]> = {
	follow: [],
	sub: [],
	resub: ["meses"],
	gift: ["cantidad"],
	raid: ["espectadores"],
	bits: ["bits"],
};

const list = (holes: readonly string[]) => holes.map((h) => `{${h}}`).join(", ");

/**
 * Error de una frase para su tipo, o `null` si vale. Lo usan el editor del estudio mientras se escribe y el servidor
 * al guardar, así que dicen lo mismo. Leer lo ya guardado no pasa por aquí: una frase vieja se sigue usando.
 */
export function phraseError(type: AlertType, text: string): string | null {
	// Vacía no es un error: al guardar, vuelve la del perfil.
	const t = text.trim();
	if (t.length > 120) return "Como mucho, 120 caracteres.";
	const holes = PHRASE_HOLES[type];
	for (const [hole, name] of t.matchAll(/\{([^}]*)\}/g))
		if (!holes.includes(name as string))
			return holes.length
				? `El hueco ${hole} no vale aquí. En esta alerta solo se rellena ${list(holes)}.`
				: `El hueco ${hole} no vale aquí. Esta alerta no tiene huecos.`;
	return null;
}
