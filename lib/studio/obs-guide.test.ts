import { describe, expect, it } from "vitest";
import { canvasById } from "@/lib/overlay/canvas";
import { guideLayers, position, size } from "./obs-guide";

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
		expect(layers.map((l) => l.name)).toEqual(["Scaena · Juego", "Cámara", "Juego"]);
		expect(size(layers[0]?.box ?? { x: 0, y: 0, width: 0, height: 0 })).toBe("1920 × 1080");
		expect(camera("game").mask).toBe(true);
		expect([position(camera("game").box), size(camera("game").box)]).toEqual([
			"x 1488 · y 816",
			"384 × 216",
		]);
	});

	it("en 3440 × 1440, todo en píxeles reales", () => {
		expect([position(camera("game", uw).box), size(camera("game", uw).box)]).toEqual([
			"x 2864 · y 1088",
			"512 × 288",
		]);
		expect(size(guideLayers("fullscreen", uw)[0]?.box ?? { x: 0, y: 0, width: 0, height: 0 })).toBe(
			"3440 × 1440",
		);
	});

	it("Just Chatting: la cámara en el hueco del fondo, sin máscara", () => {
		expect([position(camera("chatting").box), size(camera("chatting").box)]).toEqual([
			"x 64 · y 112",
			"1216 × 684",
		]);
		expect(camera("chatting").mask).toBeUndefined();
	});
});
