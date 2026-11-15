import { describe, expect, it } from "vitest";
import { SCENE_ROWS, sceneOptions } from "./params";

// specs/obs-overlays, «Opciones de cada pieza en las escenas» y «Configuración por parámetros de la URL».
describe("opciones de las escenas montadas", () => {
	it("sin parámetros, los valores de las piezas sueltas y las filas de la escena", () => {
		const o = sceneOptions({});
		expect(o).toMatchObject({ animate: true, message: true, viewers: false });
		expect(o.rows).toBeUndefined();
		expect(o.cameraName).toBeUndefined();
		expect(SCENE_ROWS).toEqual({ game: 4, chatting: 2 });
	});

	it("las opciones de cada pieza por la URL", () => {
		const o = sceneOptions({ rows: "3", animate: "0", message: "0", viewers: "1", name: "Jotis" });
		expect(o).toMatchObject({
			rows: 3,
			animate: false,
			message: false,
			viewers: true,
			cameraName: "Jotis",
		});
	});

	it("un parámetro mal formado vuelve al valor por defecto", () => {
		expect(sceneOptions({ rows: "abc" }).rows).toBeUndefined();
		expect(sceneOptions({ rows: "99" }).rows).toBeUndefined();
		expect(sceneOptions({ viewers: "quizá" }).viewers).toBe(false);
	});
});
