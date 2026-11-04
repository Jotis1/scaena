import { describe, expect, it } from "vitest";
import { bool, date, int, oneOf, optionalInt, text } from "./params";

const q = (s: string) => new URLSearchParams(s);

describe("int", () => {
	it("rows=abc → 5, el valor por defecto", () => {
		expect(int(q("rows=abc"), "rows", 5, { min: 1, max: 7 })).toBe(5);
	});
	it("lee un entero válido", () => {
		expect(int(q("rows=3"), "rows", 5, { min: 1, max: 7 })).toBe(3);
	});
	it("fuera de rango o con decimales, el valor por defecto", () => {
		expect(int(q("rows=9"), "rows", 5, { min: 1, max: 7 })).toBe(5);
		expect(int(q("rows=2.5"), "rows", 5)).toBe(5);
		expect(int(q("rows="), "rows", 5)).toBe(5);
	});
	it("sin el parámetro, el valor por defecto", () => {
		expect(int(q(""), "rows", 5)).toBe(5);
	});
	it("también con los searchParams de Next", () => {
		expect(int({ rows: ["4", "6"] }, "rows", 5)).toBe(4);
		expect(int({ rows: undefined }, "rows", 5)).toBe(5);
	});
	it("opcional: undefined si no vale", () => {
		expect(optionalInt(q("minutes=8"), "minutes", { min: 1 })).toBe(8);
		expect(optionalInt(q("minutes=0"), "minutes", { min: 1 })).toBeUndefined();
		expect(optionalInt(q(""), "minutes")).toBeUndefined();
	});
});

describe("bool", () => {
	it("acepta las formas habituales", () => {
		expect(bool(q("translucent=1"), "translucent", false)).toBe(true);
		expect(bool(q("translucent=true"), "translucent", false)).toBe(true);
		expect(bool(q("translucent=0"), "translucent", true)).toBe(false);
		expect(bool(q("translucent=OFF"), "translucent", true)).toBe(false);
	});
	it("cualquier otra cosa, el valor por defecto", () => {
		expect(bool(q("translucent=quizas"), "translucent", true)).toBe(true);
		expect(bool(q(""), "translucent", false)).toBe(false);
	});
});

describe("date", () => {
	it("ISO 8601 y milisegundos", () => {
		expect(date(q("target=2026-11-04T17:00:00Z"), "target")?.toISOString()).toBe(
			"2026-11-04T17:00:00.000Z",
		);
		expect(date(q("since=1793822580000"), "since")?.getTime()).toBe(1793822580000);
	});
	it("lo que no es una fecha, undefined", () => {
		expect(date(q("target=mañana"), "target")).toBeUndefined();
		expect(date(q("target=2026-13-45"), "target")).toBeUndefined();
		expect(date(q(""), "target")).toBeUndefined();
	});
});

describe("oneOf", () => {
	it("dentro de la lista", () => {
		expect(oneOf(q("ratio=4:3"), "ratio", ["16:9", "4:3", "1:1"], "16:9")).toBe("4:3");
	});
	it("fuera de la lista, el valor por defecto", () => {
		expect(oneOf(q("ratio=21:9"), "ratio", ["16:9", "4:3", "1:1"], "16:9")).toBe("16:9");
	});
});

describe("text", () => {
	it("recorta y junta espacios", () => {
		expect(text(q("next=  Mañana%0Aa las 17:00 "), "next", "x")).toBe("Mañana a las 17:00");
	});
	it("vacío, el valor por defecto; largo, cortado", () => {
		expect(text(q("next="), "next", "Por defecto")).toBe("Por defecto");
		expect(text(q(`name=${"a".repeat(100)}`), "name", "x", 40)).toHaveLength(40);
	});
});
