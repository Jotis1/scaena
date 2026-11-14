import { describe, expect, it } from "vitest";
import { CAMERA_HOLE, CAMERA_RADIUS_RATIO, gameCamera, scaleBox } from "./boxes";

describe("medidas de las escenas", () => {
	it("cámara de juego: 384 × 216 abajo a la derecha, con el ancho que sobra en el centro", () => {
		expect(gameCamera()).toEqual({ x: 1488, y: 816, width: 384, height: 216 });
		expect(gameCamera(2580)).toEqual({ x: 2148, y: 816, width: 384, height: 216 });
	});

	it("en píxeles de OBS: 1:1 en 1920 × 1080 y 4/3 en 3440 × 1440", () => {
		expect(scaleBox(gameCamera(), 1)).toEqual({ x: 1488, y: 816, width: 384, height: 216 });
		expect(scaleBox(gameCamera(2580), 4 / 3)).toEqual({ x: 2864, y: 1088, width: 512, height: 288 });
		expect(scaleBox(CAMERA_HOLE, 4 / 3)).toEqual({ x: 85, y: 149, width: 1621, height: 912 });
	});

	it("el radio va en proporción al ancho: 80 px en una cámara de 1920", () => {
		expect(1920 * CAMERA_RADIUS_RATIO).toBe(80);
	});
});
