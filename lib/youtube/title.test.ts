import { describe, expect, it } from "vitest";
import { cardLine, gameLine, parseTitle } from "./title";

describe("tipo y juego desde el título", () => {
	it("«La ciudad que nunca duerme - Cyberpunk 2077 #1» es un directo resubido", () => {
		const p = parseTitle("La ciudad que nunca duerme - Cyberpunk 2077 #1");
		expect(p).toEqual({
			kind: "live",
			title: "La ciudad que nunca duerme",
			game: "Cyberpunk 2077",
			number: 1,
		});
		expect(gameLine(p)).toBe("Cyberpunk 2077 #1");
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

describe("línea de la tarjeta de vídeo", () => {
	it("un directo de 3 h 12 min 40 s lleva tipo, juego, número y duración", () => {
		const p = parseTitle("La ciudad que nunca duerme - Cyberpunk 2077 #1");
		expect(cardLine(p, 3 * 3600 + 12 * 60 + 40)).toBe("Directo resubido. Cyberpunk 2077 #1, 3:12:40");
	});

	it("un editado de 10 min 4 s lleva tipo y duración", () => {
		expect(cardLine(parseTitle("Cinco horas en Night City en diez minutos"), 604)).toBe("Editado, 10:04");
	});
});
