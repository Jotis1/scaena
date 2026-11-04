import { describe, expect, it } from "vitest";
import { type ChatMessageEvent, TONES, toChatMessage, toneFor, toRegulaBadges } from "./message";

const base: ChatMessageEvent = {
	type: "message",
	channel: "jotis1",
	id: "m1",
	userId: "87654321",
	login: "ronni",
	displayName: "Ronni",
	text: "Hola",
	action: false,
	badges: [],
};

describe("insignias", () => {
	it("moderador suscrito → mod y sub, en ese orden", () => {
		expect(toRegulaBadges(["subscriber", "moderator"])).toEqual(["mod", "sub"]);
	});

	it("como mucho tres, por rango", () => {
		expect(toRegulaBadges(["bits", "subscriber", "vip", "moderator", "broadcaster"])).toEqual([
			"broadcaster",
			"mod",
			"vip",
		]);
	});

	it("founder cuenta como sub y no se repite", () => {
		expect(toRegulaBadges(["founder", "subscriber"])).toEqual(["sub"]);
	});

	it("ignora las insignias que Regula no tiene", () => {
		expect(toRegulaBadges(["glhf-pledge", "premium", "partner"])).toEqual([]);
	});
});

describe("tono", () => {
	it("mismo usuario, mismo tono", () => {
		expect(toneFor("87654321")).toBe(toneFor("87654321"));
	});

	it("nunca neutral y siempre de la lista", () => {
		for (let i = 0; i < 200; i++) expect(TONES).toContain(toneFor(String(i)));
	});

	it("usuarios distintos se reparten entre los tonos", () => {
		const used = new Set(Array.from({ length: 200 }, (_, i) => toneFor(String(1000 + i))));
		expect(used.size).toBe(TONES.length);
	});
});

describe("toChatMessage", () => {
	it("nombre visible, id, texto tal cual, tono por user-id e insignias", () => {
		const m = toChatMessage({ ...base, badges: ["moderator", "subscriber"] });
		expect(m).toEqual({
			id: "m1",
			user: "Ronni",
			text: "Hola",
			tone: toneFor("87654321"),
			badges: ["mod", "sub"],
		});
	});

	it("el texto con HTML se queda como texto", () => {
		const html = "<img src=x onerror=alert(1)>";
		expect(toChatMessage({ ...base, text: html }).text).toBe(html);
	});

	it("el tono no cambia si el usuario cambia su nombre visible", () => {
		expect(toChatMessage({ ...base, displayName: "OtroNombre" }).tone).toBe(toChatMessage(base).tone);
	});
});
