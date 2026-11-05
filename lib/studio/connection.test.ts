import { describe, expect, it } from "vitest";
import { SUBSCRIPTIONS } from "../twitch/eventsub/normalize";
import type { SubscriptionRow } from "../twitch/eventsub/subscriptions";
import { activeCount, connectionView, eventsNotice, revokedNotice } from "./connection";

const rows = (over: Partial<Record<string, Partial<SubscriptionRow>>> = {}): SubscriptionRow[] =>
	SUBSCRIPTIONS.map(({ type }) => ({ type, state: "enabled", ...over[type] }));

describe("textos de la conexión", () => {
	it("sin ninguna suscripción, la vista es «sin conectar»", () => {
		expect(connectionView(SUBSCRIPTIONS.map(({ type }) => ({ type, state: "missing" })))).toBe("none");
	});

	it("con todas activas, «conectado» y 8 de 8", () => {
		expect(connectionView(rows())).toBe("connected");
		expect(activeCount(rows())).toBe("8 de 8 activas");
		expect(revokedNotice(rows())).toBeNull();
	});

	it("una raid revocada da el aviso del diseño", () => {
		const r = rows({ "channel.raid": { state: "revoked", reason: "notification_failures_exceeded" } });
		expect(connectionView(r)).toBe("revoked");
		expect(activeCount(r)).toBe("7 de 8 activas");
		expect(revokedNotice(r)).toEqual({
			title: "Twitch ha revocado una suscripción",
			description:
				"Las raids no llegarán a las alertas ni a los eventos hasta que la reactives. Motivo que da Twitch: demasiados fallos de entrega.",
		});
	});

	it("varias revocadas: las nombra todas", () => {
		const r = rows({
			"channel.raid": { state: "revoked", reason: "authorization_revoked" },
			"channel.cheer": { state: "revoked", reason: "authorization_revoked" },
		});
		expect(revokedNotice(r)?.title).toBe("Twitch ha revocado 2 suscripciones");
		expect(revokedNotice(r)?.description).toMatch(/^Bits, Raid: .*retirado la autorización/);
	});
});

describe("aviso de eventos en el resto del estudio", () => {
	it("sin conectar: pide conectarlos", () => {
		const n = eventsNotice(SUBSCRIPTIONS.map(({ type }) => ({ type, state: "missing" })));
		expect(n).toMatchObject({ title: "Eventos sin conectar", action: "Conectar eventos" });
	});

	it("todo activo o verificando: nada", () => {
		expect(eventsNotice(rows())).toBeNull();
		expect(eventsNotice(rows({ "stream.online": { state: "pending" } }))).toBeNull();
	});

	it("una revocada: el mismo aviso que la página de conexión", () => {
		const n = eventsNotice(
			rows({ "channel.raid": { state: "revoked", reason: "authorization_revoked" } }),
		);
		expect(n?.title).toBe("Twitch ha revocado una suscripción");
		expect(n?.action).toBe("Revisar la conexión");
	});

	it("alguna sin dar de alta: dice cuáles", () => {
		const n = eventsNotice(rows({ "channel.cheer": { state: "missing" } }));
		expect(n).toEqual({
			title: "Falta un evento por conectar",
			description: "Bits: no llegarán a los overlays hasta que los des de alta.",
			action: "Revisar la conexión",
		});
	});
});
