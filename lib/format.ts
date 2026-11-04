// Formatos de la guía de Regula: castellano de España, `1.284`, `5,00 €`, `29 oct 2026`.
// Cifras e importes salen tal cual de Regula; aquí solo lo que Scaena necesita además.
import { formatCurrency, formatNumber } from "@jotis-me/react";

export { formatCurrency, formatNumber };

const LOCALE = "es-ES";
/** Hora peninsular: Vercel corre en UTC y sin esto un vídeo subido a las 00:30 saldría con el día anterior. */
export const TIME_ZONE = "Europe/Madrid";

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: TIME_ZONE,
});

/** `2026-10-29T10:00:00Z` → `29 oct 2026`, en hora peninsular. */
export function formatDate(date: Date | string | number): string {
	return dateFormat.format(new Date(date));
}

/** Duración de un vídeo: `90` → `1:30`, `11560` → `3:12:40`. */
export function formatDuration(seconds: number): string {
	const t = Math.max(0, Math.floor(seconds));
	const h = Math.floor(t / 3600);
	const m = Math.floor((t % 3600) / 60);
	const s = t % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Duración ISO 8601 de YouTube (`PT3H12M40S`) a segundos; `null` si no se entiende. */
export function secondsFromIsoDuration(iso: string): number | null {
	const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
	if (!m || iso === "P" || iso.endsWith("T")) return null;
	const [, d = "0", h = "0", min = "0", s = "0"] = m;
	return Number(d) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s);
}

/**
 * Hora relativa de un evento, que se entiende al instante (ficha de `StreamEvents`):
 * menos de un minuto → `ahora`; luego `hace 3 min`, `hace 2 h` y, desde un día, `hace 3 d`.
 */
export function formatTimeAgo(
	when: Date | string | number,
	now: Date | string | number = Date.now(),
): string {
	const sec = Math.max(0, Math.floor((new Date(now).getTime() - new Date(when).getTime()) / 1000));
	if (sec < 60) return "ahora";
	const min = Math.floor(sec / 60);
	if (min < 60) return `hace ${min} min`;
	const h = Math.floor(min / 60);
	if (h < 24) return `hace ${h} h`;
	return `hace ${Math.floor(h / 24)} d`;
}
