import { describe, expect, it } from "vitest";
import { sign, verifySignature } from "./signature";

const SECRET = "un-secreto-de-pruebas";
const ID = "befa7b53-d79d-478f-86b9-120f112b044e";
const TS = "2026-11-04T17:00:00.123456789Z";
const NOW = Date.parse("2026-11-04T17:01:00Z");
const BODY = '{"subscription":{"type":"channel.follow"},"event":{"user_name":"Ana"}}';

const base = { id: ID, timestamp: TS, body: BODY, secret: SECRET, now: NOW };

describe("firma de EventSub", () => {
	it("acepta una firma buena", () => {
		expect(verifySignature({ ...base, signature: sign(SECRET, ID, TS, BODY) })).toEqual({ valid: true });
	});

	it("rechaza una firma hecha con otro secreto", () => {
		expect(verifySignature({ ...base, signature: sign("otro-secreto", ID, TS, BODY) })).toEqual({
			valid: false,
			reason: "signature",
		});
	});

	it("rechaza un cuerpo alterado, aunque sea un espacio", () => {
		const signature = sign(SECRET, ID, TS, BODY);
		expect(verifySignature({ ...base, body: `${BODY} `, signature }).valid).toBe(false);
		expect(verifySignature({ ...base, body: BODY.replace("Ana", "Eva"), signature }).valid).toBe(false);
	});

	it("rechaza una firma mal formada o de otra longitud", () => {
		expect(verifySignature({ ...base, signature: "sha256=abc" }).valid).toBe(false);
		expect(verifySignature({ ...base, signature: "basura" }).valid).toBe(false);
	});

	it("rechaza una notificación de hace quince minutos aunque la firma sea buena", () => {
		const old = "2026-11-04T16:46:00Z";
		expect(verifySignature({ ...base, timestamp: old, signature: sign(SECRET, ID, old, BODY) })).toEqual({
			valid: false,
			reason: "stale",
		});
	});

	it("rechaza que falten cabeceras", () => {
		expect(verifySignature({ ...base, id: null, signature: "x" })).toEqual({
			valid: false,
			reason: "missing headers",
		});
	});
});
