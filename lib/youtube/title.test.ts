import { describe, expect, it } from "vitest";
import { gameLine, parseTitle } from "./title";

describe("tipo y juego desde el título", () => {
	it("«La ciudad que nunca duerme - Cyberpunk 2077 #1» es un directo resubido", () => {
		const p = parseTitle("La ciudad que nunca duerme - Cyberpunk 2077 #1");
		expect(p).toEqual({
			kind: "live",
			title: "La ciudad que nunca duerme",
			game: "Cyberpunk 2077",
			number: 1,
		});
		expect(gameLine(p)).toBe("Cyberpunk 2077 - #1");
	});

	it("con guion dentro del título, el último « - » separa el juego", () => {
		expect(parseTitle("Antes - después - Elden Ring #12")).toEqual({
			kind: "live",
			title: "Antes - después",
			game: "Elden Ring",
			number: 12,
		});
	});

	it("un editado cualquiera queda tal cual", () => {
		expect(parseTitle("Cinco horas en Night City en diez minutos")).toEqual({
			kind: "edited",
			title: "Cinco horas en Night City en diez minutos",
		});
	});

	it("casi el formato: también editados", () => {
		for (const t of ["Cyberpunk 2077 #1", "Algo - Cyberpunk 2077 #uno"])
			expect(parseTitle(t)).toEqual({ kind: "edited", title: t });
	});
});
