import { describe, expect, it } from "vitest";
import { canvasLabel, canvasOf } from "./canvas";

// specs/obs-overlays, «Lienzo de emisión».
describe("lienzo de las escenas", () => {
	it("`canvas=3440x1440` da un lienzo lógico de 2580 de ancho a escala 4/3", () => {
		const c = canvasOf(new URLSearchParams("canvas=3440x1440"));
		expect(c).toEqual({ id: "3440x1440", width: 2580, scale: 4 / 3 });
		expect(c.width * c.scale).toBe(3440);
		expect(1080 * c.scale).toBe(1440);
		expect(canvasLabel(c)).toBe("3440 × 1440");
	});

	it("sin `canvas`, 1920×1080 a escala 1", () => {
		expect(canvasOf(new URLSearchParams())).toEqual({ id: "1920x1080", width: 1920, scale: 1 });
		expect(canvasOf({})).toEqual({ id: "1920x1080", width: 1920, scale: 1 });
	});

	it("un valor que no se reconoce cae a 1920×1080", () => {
		for (const v of ["1234x567", "3440X1440", "2560x1080", ""]) {
			expect(canvasOf(new URLSearchParams({ canvas: v })), v).toMatchObject({ width: 1920, scale: 1 });
		}
		expect(canvasLabel(canvasOf({ canvas: "1234x567" }))).toBe("1920 × 1080");
	});
});
