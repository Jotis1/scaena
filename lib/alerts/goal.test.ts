import { describe, expect, it } from "vitest";
import type { AlertEvent } from "../twitch/eventsub/event";
import { goalIncrement } from "./goal";

const ev = (over: Partial<AlertEvent>): AlertEvent => ({
	id: "x",
	channelId: "1",
	type: "follow",
	user: "Ana",
	ts: 0,
	...over,
});

describe("meta", () => {
	it("284 + un regalo de 5 = 289", () => {
		expect(284 + goalIncrement("subs", ev({ type: "gift", amount: 5 }))).toBe(289);
	});

	it("subs: cuentan nuevas y regaladas, no renovaciones ni follows", () => {
		expect(goalIncrement("subs", ev({ type: "sub" }))).toBe(1);
		expect(goalIncrement("subs", ev({ type: "resub", months: 3 }))).toBe(0);
		expect(goalIncrement("subs", ev({ type: "follow" }))).toBe(0);
	});

	it("seguidores y bits", () => {
		expect(goalIncrement("follows", ev({ type: "follow" }))).toBe(1);
		expect(goalIncrement("bits", ev({ type: "bits", amount: 500 }))).toBe(500);
		expect(goalIncrement("bits", ev({ type: "raid", amount: 1284 }))).toBe(0);
	});

	it("las alertas de prueba no mueven la meta", () => {
		expect(goalIncrement("subs", ev({ type: "gift", amount: 5, test: true }))).toBe(0);
	});
});
