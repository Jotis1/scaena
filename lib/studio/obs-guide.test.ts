import { describe, expect, it } from "vitest";
import { canvasById } from "@/lib/overlay/canvas";
import { cameraDiagram, guideLayers, position, size } from "./obs-guide";

const hd = canvasById("1920x1080");
const uw = canvasById("3440x1440");
const camera = (scene: "game" | "chatting", c = hd) => {
	const l = guideLayers(scene, c).find((x) => x.name === "Cámara");
	if (!l) throw new Error("sin cámara");
	return l;
};

describe("guía de OBS", () => {
	it("juego: la escena arriba, la cámara con máscara en medio y el juego debajo", () => {
		const layers = guideLayers("game", hd);
		expect(layers.map((l) => l.name)).toEqual(["Escena de juego", "Cámara", "Juego"]);
		expect(size(layers[0]?.box ?? { x: 0, y: 0, width: 0, height: 0 })).toBe("1.920 × 1.080");
		expect(camera("game").mask).toBe(true);
		expect([position(camera("game").box), size(camera("game").box)]).toEqual(["1.488, 816", "384 × 216"]);
	});

	it("en 3440 × 1440, todo en píxeles reales", () => {
		expect([position(camera("game", uw).box), size(camera("game", uw).box)]).toEqual([
			"2.864, 1.088",
			"512 × 288",
		]);
		expect(size(guideLayers("fullscreen", uw)[0]?.box ?? { x: 0, y: 0, width: 0, height: 0 })).toBe(
			"3.440 × 1.440",
		);
	});

	it("Just Chatting: la cámara en el hueco del fondo, sin máscara", () => {
		expect([position(camera("chatting").box), size(camera("chatting").box)]).toEqual([
			"64, 112",
			"1.216 × 684",
		]);
		expect(camera("chatting").mask).toBeUndefined();
	});

	it("el esquema saca la cámara de las mismas cajas: 77,5 % y 75,56 % en 1920", () => {
		expect(cameraDiagram("game", hd)).toEqual({ x: 77.5, y: 75.56, width: 20, height: 20 });
		expect(cameraDiagram("game", uw)).toEqual({ x: 83.26, y: 75.56, width: 14.88, height: 20 });
		expect(cameraDiagram("chatting", hd)).toEqual({ x: 3.33, y: 10.37, width: 63.33, height: 63.33 });
	});
});
