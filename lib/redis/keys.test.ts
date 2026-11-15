import { describe, expect, it } from "vitest";
import { type ChannelKeyPart, keys } from "./keys";

const PARTS: ChannelKeyPart[] = [
	"events",
	"status",
	"status:last",
	"youtube",
	"youtube:uploads",
	"youtube:lock",
	"eventsub",
	"token",
	"settings",
	"goal",
	"twitch-goal",
	"goal-done",
	"twitch-goals",
];

describe("claves de Redis", () => {
	it("pone todo lo de un canal bajo su prefijo", () => {
		expect(keys.channel("12345", "events")).toBe("channel:12345:events");
	});

	it("las claves de dos canales nunca coinciden", () => {
		const a = PARTS.map((p) => keys.channel("1", p));
		const b = PARTS.map((p) => keys.channel("12", p));
		expect(new Set([...a, ...b]).size).toBe(PARTS.length * 2);
		for (const k of b) expect(k.startsWith("channel:1:")).toBe(false);
	});

	it("dentro de un canal, cada parte tiene su clave", () => {
		expect(new Set(PARTS.map((p) => keys.channel("1", p))).size).toBe(PARTS.length);
	});

	it("rechaza ids que no son el id numérico de Twitch", () => {
		expect(() => keys.channel("jotis_1", "events")).toThrow(/id numérico/);
		expect(() => keys.channel("1:events", "token")).toThrow();
		expect(() => keys.channel("", "token")).toThrow();
	});

	it("lo global queda fuera del prefijo de canal", () => {
		for (const k of [keys.appToken(), keys.eventsubSeen("abc"), keys.idFromLogin("Jotis_1")])
			expect(k.startsWith("channel:")).toBe(false);
		expect(keys.idFromLogin("Jotis_1")).toBe("app:twitch:login:jotis_1");
	});

	it("la cuenta de cada meta va bajo su canal y solo acepta ids de meta válidos", () => {
		expect(keys.goalCount("1", "ab12cd34")).toBe("channel:1:goal:ab12cd34");
		expect(keys.goalCount("1", "ab12cd34")).not.toBe(keys.goalCount("1", "zz12cd34"));
		expect(() => keys.goalCount("1", "x:events")).toThrow(/meta no válido/);
		expect(() => keys.goalCount("1", "AB12CD34")).toThrow();
		expect(() => keys.goalCount("jotis_1", "ab12cd34")).toThrow(/id numérico/);
	});
});
