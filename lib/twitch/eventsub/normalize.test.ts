import { describe, expect, it } from "vitest";
import * as F from "./fixtures";
import { type Notification, normalize } from "./normalize";

const TS = Date.parse("2026-11-04T17:00:00Z");
const alert = (n: Notification) => {
	const r = normalize(n, "msg-1", TS);
	if (r.kind !== "alert") throw new Error(`se esperaba una alerta y llegó ${r.kind}`);
	return r.event;
};

describe("normalizar notificaciones de EventSub", () => {
	it("follow", () => {
		expect(alert(F.FOLLOW)).toEqual({
			id: "msg-1",
			ts: TS,
			channelId: "1337",
			type: "follow",
			user: "Cool_User",
		});
	});

	it("sub de nivel 1", () => {
		expect(alert(F.SUB)).toMatchObject({ type: "sub", user: "Cool_User", tier: 1 });
	});

	it("la sub regalada se ignora: ya cuenta el regalo", () => {
		expect(normalize(F.GIFTED_SUB, "msg-1", TS)).toMatchObject({ kind: "ignore" });
	});

	it("renovación de 14 meses con su mensaje tal cual", () => {
		expect(alert(F.RESUB)).toMatchObject({
			type: "resub",
			months: 14,
			tier: 2,
			message: "Catorce meses <b>ya</b>",
		});
	});

	it("5 subs regaladas, y anónimas", () => {
		expect(alert(F.GIFT)).toMatchObject({ type: "gift", user: "Cool_User", amount: 5 });
		expect(alert(F.ANONYMOUS_GIFT)).toMatchObject({ type: "gift", user: "Anónimo", amount: 2 });
	});

	it("500 bits", () => {
		expect(alert(F.BITS)).toMatchObject({ type: "bits", amount: 500, message: "pogchamp" });
	});

	it("raid entrante de 1.284: el canal es el que lo recibe", () => {
		expect(alert(F.RAID)).toMatchObject({
			type: "raid",
			user: "Otro_Canal",
			amount: 1284,
			channelId: "1337",
		});
	});

	it("empieza y acaba el directo", () => {
		expect(normalize(F.ONLINE, "x", TS)).toEqual({ kind: "status", channelId: "1337", live: true });
		expect(normalize(F.OFFLINE, "x", TS)).toEqual({ kind: "status", channelId: "1337", live: false });
	});

	it("ignora tipos que Scaena no usa y eventos sin canal", () => {
		expect(normalize({ subscription: { type: "channel.ban" }, event: {} }, "x", TS).kind).toBe("ignore");
		expect(normalize({ subscription: { type: "channel.follow" }, event: {} }, "x", TS).kind).toBe(
			"ignore",
		);
	});

	it("un mensaje vacío no se guarda", () => {
		const n = structuredClone(F.BITS);
		n.event.message = "   ";
		expect(alert(n).message).toBeUndefined();
	});
});
