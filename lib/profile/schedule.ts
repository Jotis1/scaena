// Textos del horario habitual (specs/channel-profile, «Horario habitual»), tal como salen en el diseño:
// web y panel «Normalmente 17:00 – 20:00», banner «Suele ser 17-20 h», escenas «Normalmente, de 17:00 a 20:00».
import { DAYS, type Day, type Profile } from "./schema";

type Schedule = Profile["schedule"];

const NOT_FIXED = "Sin fijar";
const EVERY_DAY = "Todos los días";
const list = new Intl.ListFormat("es-ES", { style: "long", type: "conjunction" });

/** Nombre del día en castellano, tal como se muestra. */
const DAY_NAMES: Record<Day, string> = {
	monday: "lunes",
	tuesday: "martes",
	wednesday: "miércoles",
	thursday: "jueves",
	friday: "viernes",
	saturday: "sábado",
	sunday: "domingo",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `17:00` → `17`; `17:30` → `17:30`. Para la forma corta del banner. */
function shortTime(t: string): string {
	const [hh, mm] = t.split(":");
	return mm === "00" ? String(Number(hh)) : `${Number(hh)}:${mm}`;
}

/** `17:00 – 20:00`, con raya y espacios. */
export function slotText(s: Schedule): string {
	return `${s.start} – ${s.end}`;
}

/** Web y panel: `Normalmente 17:00 – 20:00`. */
export function usuallyText(s: Schedule): string {
	return `Normalmente ${slotText(s)}`;
}

/** Banner, donde cabe menos: `17-20 h`, o `17:30-20 h` si hay minutos. */
export function shortSlotText(s: Schedule): string {
	return `${shortTime(s.start)}-${shortTime(s.end)} h`;
}

/** Pie de las escenas: `Normalmente, de 17:00 a 20:00`. */
export function sceneFooter(s: Schedule): string {
	return `Normalmente, de ${s.start} a ${s.end}`;
}

function sortedDays(days: readonly Day[]): Day[] {
	return [...new Set(days)].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
}

/** `Sin fijar`, `Todos los días` o `Lunes, miércoles y viernes`. */
export function daysText(s: Schedule): string {
	if (!s.days?.length) return NOT_FIXED;
	const d = sortedDays(s.days);
	if (d.length === DAYS.length) return EVERY_DAY;
	return capitalize(list.format(d.map((x) => DAY_NAMES[x])));
}

/** Para el banner: `Lun, mié y vie`. */
export function shortDaysText(s: Schedule): string {
	if (!s.days?.length) return NOT_FIXED;
	const d = sortedDays(s.days);
	if (d.length === DAYS.length) return EVERY_DAY;
	return capitalize(list.format(d.map((x) => DAY_NAMES[x].slice(0, 3))));
}

/** Filas del panel de horario de Twitch (`ChannelPanel.rows`). */
export function panelRows(s: Schedule): { label: string; value: string }[] {
	return [
		{ label: "Normalmente", value: slotText(s) },
		{ label: "Días", value: daysText(s) },
	];
}

/** Filas del horario del banner (`ChannelBanner.schedule`): siempre dos, cada una en una línea. */
export function bannerRows(s: Schedule): { day: string; time: string }[] {
	return [
		{ day: "Suele ser", time: shortSlotText(s) },
		{ day: "Días", time: shortDaysText(s) },
	];
}
