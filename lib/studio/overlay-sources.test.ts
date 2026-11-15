import { describe, expect, it } from "vitest";
import { guideAnchor, kindOf, sourceOf } from "./overlay-sources";

describe("fuente elegida en Overlays", () => {
	it("`?source=` manda; uno desconocido vuelve al chat", () => {
		expect(sourceOf({ source: "goal" })).toBe("goal");
		expect(sourceOf({ source: "brb", tab: "pieces" })).toBe("brb");
		expect(sourceOf({ source: "nada" })).toBe("chat");
		expect(sourceOf({})).toBe("chat");
	});

	it("el enlace antiguo `?tab=scenes` abre la escena de juego", () => {
		expect(sourceOf({ tab: "scenes" })).toBe("game");
	});

	it("las escenas van bajo `scene/` en la URL del overlay, y cada una a su sección de la guía", () => {
		expect(kindOf("chat")).toBe("chat");
		expect(kindOf("game")).toBe("scene/game");
		expect(guideAnchor("chatting")).toBe("chatting");
		expect(guideAnchor("offline")).toBe("fullscreen");
	});
});
