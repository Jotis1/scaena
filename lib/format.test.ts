import { describe, expect, it } from "vitest";
import {
	formatCurrency,
	formatDate,
	formatDuration,
	formatNumber,
	formatTimeAgo,
	secondsFromIsoDuration,
} from "./format";

describe("cifras e importes (de Regula)", () => {
	it("agrupa también las cifras de cuatro dígitos", () => {
		expect(formatNumber(1284)).toBe("1.284");
		expect(formatNumber(300)).toBe("300");
	});

	it("importes en euros con coma decimal", () => {
		// Intl separa la cifra y el símbolo con un espacio duro.
		expect(formatCurrency(5)).toBe("5,00 €");
		expect(formatCurrency(1284.5)).toBe("1.284,50 €");
	});
});

describe("formatDate", () => {
	it("escribe la fecha corta en castellano", () => {
		expect(formatDate("2026-10-29T10:00:00Z")).toBe("29 oct 2026");
	});

	it("usa la hora peninsular, no la del servidor", () => {
		// 23:30 UTC del 28 de octubre ya es día 29 en Madrid (UTC+1 en invierno).
		expect(formatDate("2026-10-28T23:30:00Z")).toBe("29 oct 2026");
	});
});

describe("formatDuration", () => {
	it("sin horas: m:ss", () => {
		expect(formatDuration(90)).toBe("1:30");
		expect(formatDuration(5)).toBe("0:05");
	});

	it("con horas: h:mm:ss", () => {
		expect(formatDuration(11560)).toBe("3:12:40");
		expect(formatDuration(3725)).toBe("1:02:05");
	});

	it("nunca negativa", () => {
		expect(formatDuration(-4)).toBe("0:00");
	});
});

describe("secondsFromIsoDuration", () => {
	it("lee las duraciones de YouTube", () => {
		expect(secondsFromIsoDuration("PT3H12M40S")).toBe(11560);
		expect(secondsFromIsoDuration("PT45S")).toBe(45);
		expect(secondsFromIsoDuration("P1DT2H")).toBe(93600);
	});

	it("rechaza lo que no es una duración", () => {
		expect(secondsFromIsoDuration("3:12:40")).toBeNull();
		expect(secondsFromIsoDuration("P")).toBeNull();
		expect(secondsFromIsoDuration("PT")).toBeNull();
	});
});

describe("formatTimeAgo", () => {
	const now = "2026-11-04T20:00:00Z";
	it("menos de un minuto es ahora", () => {
		expect(formatTimeAgo("2026-11-04T19:59:30Z", now)).toBe("ahora");
	});
	it("minutos, horas y días", () => {
		expect(formatTimeAgo("2026-11-04T19:57:00Z", now)).toBe("hace 3 min");
		expect(formatTimeAgo("2026-11-04T18:00:00Z", now)).toBe("hace 2 h");
		expect(formatTimeAgo("2026-11-01T20:00:00Z", now)).toBe("hace 3 d");
	});
	it("un evento con hora futura cuenta como ahora", () => {
		expect(formatTimeAgo("2026-11-04T20:05:00Z", now)).toBe("ahora");
	});
});
