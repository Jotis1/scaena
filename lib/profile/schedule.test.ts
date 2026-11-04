import { describe, expect, it } from "vitest";
import { getMainProfile } from ".";
import {
	bannerRows,
	daysText,
	panelRows,
	sceneFooter,
	shortDaysText,
	shortSlotText,
	usuallyText,
} from "./schedule";

const usual = { start: "17:00", end: "20:00", zone: "Hora peninsular" };

describe("horario habitual", () => {
	it("los textos del diseño, con el horario real del perfil", () => {
		const s = getMainProfile().schedule;
		expect(usuallyText(s)).toBe("Normalmente 17:00 – 20:00");
		expect(shortSlotText(s)).toBe("17-20 h");
		expect(sceneFooter(s)).toBe("Normalmente, de 17:00 a 20:00");
		expect(daysText(s)).toBe("Sin fijar");
	});

	it("panel y banner, como en el diseño", () => {
		expect(panelRows(usual)).toEqual([
			{ label: "Normalmente", value: "17:00 – 20:00" },
			{ label: "Días", value: "Sin fijar" },
		]);
		expect(bannerRows(usual)).toEqual([
			{ day: "Suele ser", time: "17-20 h" },
			{ day: "Días", time: "Sin fijar" },
		]);
	});

	it("la forma corta conserva los minutos si los hay", () => {
		expect(shortSlotText({ ...usual, start: "17:30", end: "09:00" })).toBe("17:30-9 h");
	});

	it("con días: en orden de la semana, en castellano y sin repetir", () => {
		const withDays = { ...usual, days: ["friday", "monday", "wednesday", "monday"] as const };
		const s = { ...withDays, days: [...withDays.days] };
		expect(daysText(s)).toBe("Lunes, miércoles y viernes");
		expect(shortDaysText(s)).toBe("Lun, mié y vie");
		expect(bannerRows(s)[1]).toEqual({ day: "Días", time: "Lun, mié y vie" });
	});

	it("un solo día y todos los días", () => {
		expect(daysText({ ...usual, days: ["saturday"] })).toBe("Sábado");
		const all = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
		expect(daysText({ ...usual, days: [...all] })).toBe("Todos los días");
	});

	it("el banner nunca pasa de cuatro filas", () => {
		expect(bannerRows(usual).length).toBeLessThanOrEqual(4);
	});
});
