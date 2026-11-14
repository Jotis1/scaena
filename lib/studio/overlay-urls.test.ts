import { describe, expect, it } from "vitest";
import { maskToken, sourceUrl } from "./overlay-urls";

const C = {
	origin: "https://scaena.jotis.me",
	channel: "jotis_1",
	token: "tok-secreto-a91f",
	now: 1793822580000,
};

describe("URL de las fuentes", () => {
	it("chat: sin opciones, sin parámetros; translúcido añade `translucent=1`", () => {
		expect(sourceUrl("chat", {}, C)).toBe("https://scaena.jotis.me/overlay/jotis_1/chat");
		expect(sourceUrl("chat", { translucent: true, animate: true }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/chat?translucent=1",
		);
	});

	it("las de eventos llevan token; el chat y el estado no", () => {
		expect(sourceUrl("alerts", {}, C)).toContain("token=tok-secreto-a91f");
		expect(sourceUrl("events", { rows: 5 }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/events?rows=5&token=tok-secreto-a91f",
		);
		expect(sourceUrl("status", {}, C)).not.toContain("token");
		expect(sourceUrl("status", { viewers: true }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/status?viewers=1",
		);
	});

	it("la meta lleva tipo, cifras, `since` y token", () => {
		const u = new URL(
			sourceUrl("goal", { goalType: "subs", label: "Subs del mes", start: 284, goal: 300 }, C),
		);
		expect(Object.fromEntries(u.searchParams)).toEqual({
			type: "subs",
			label: "Subs del mes",
			start: "284",
			goal: "300",
			since: "1793822580000",
			token: "tok-secreto-a91f",
		});
	});

	it("escenas montadas: token y piezas quitadas con 0", () => {
		expect(sourceUrl("scene/game", { goalPiece: false, camera: false }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/scene/game?camera=0&goal=0&token=tok-secreto-a91f",
		);
		expect(sourceUrl("scene/chatting", {}, C)).toContain("since=1793822580000&token=");
	});

	it("escenas: cuenta atrás en minutos y línea del pie", () => {
		expect(sourceUrl("scene/brb", { minutes: 8 }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/scene/brb?minutes=8",
		);
		expect(sourceUrl("scene/ending", { next: "Mañana, a las 17:00" }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/scene/ending?next=Ma%C3%B1ana%2C+a+las+17%3A00",
		);
	});

	it("lienzo: `canvas=3440x1440` solo en las escenas y solo si se elige", () => {
		const scenes = [
			"scene/game",
			"scene/chatting",
			"scene/starting",
			"scene/brb",
			"scene/ending",
			"scene/offline",
		] as const;
		for (const kind of scenes) {
			expect(
				new URL(sourceUrl(kind, { canvas: "3440x1440" }, C)).searchParams.get("canvas"),
				kind,
			).toBe("3440x1440");
			expect(sourceUrl(kind, { canvas: "1920x1080" }, C), kind).not.toContain("canvas");
			expect(sourceUrl(kind, {}, C), kind).not.toContain("canvas");
		}
		for (const kind of ["chat", "alerts", "events", "goal", "status", "camera"] as const) {
			expect(sourceUrl(kind, { canvas: "3440x1440" }, C), kind).not.toContain("canvas");
		}
		expect(sourceUrl("scene/offline", { canvas: "3440x1440" }, C)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/scene/offline?canvas=3440x1440",
		);
		// Antes del token, que va siempre al final.
		expect(sourceUrl("scene/game", { canvas: "3440x1440" }, C)).toMatch(/canvas=3440x1440&token=/);
	});

	it("el token se enseña tapado", () => {
		expect(maskToken(sourceUrl("alerts", {}, C), C.token)).toBe(
			"https://scaena.jotis.me/overlay/jotis_1/alerts?token=••••a91f",
		);
	});
});
