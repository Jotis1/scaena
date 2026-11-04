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
