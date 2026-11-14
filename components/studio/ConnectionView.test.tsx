import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TWITCH_SCOPES } from "@/lib/auth";
import { SUBSCRIPTIONS } from "@/lib/twitch/eventsub/normalize";
import type { ConnectionStatus, SubscriptionRow } from "@/lib/twitch/eventsub/subscriptions";
import { ConnectionView } from "./ConnectionView";

// Los tres estados de /studio/connection (diseño: «Conexión - sin conectar», «conectado» y «suscripción revocada»),
// sin Twitch: el estado llega ya leído.
const noop = async () => ({});
const render = (status: ConnectionStatus) =>
	renderToStaticMarkup(<ConnectionView status={status} name="jotis_1" connect={noop} disconnect={noop} />);
const rows = (state: (t: SubscriptionRow["type"]) => SubscriptionRow["state"]): SubscriptionRow[] =>
	SUBSCRIPTIONS.map(({ type }) => ({ type, state: state(type), reason: "notification_failures_exceeded" }));
const primaries = (html: string) => html.match(/[" ]bg-brand-solid[" ]/g)?.length ?? 0;

describe("conexión con Twitch", () => {
	it("sin conectar: estado vacío, «Conectar eventos» y los permisos de lectura", () => {
		const html = render({ rows: rows(() => "missing") });
		expect(html).toContain("Eventos sin conectar");
		expect(html).toContain("Conectar eventos");
		for (const s of TWITCH_SCOPES) expect(html).toContain(s);
		expect(html).not.toContain("<table");
		expect(primaries(html)).toBe(1);
	});

	it("conectado: la cuenta, «Conectado», «Desconectar» y la tabla con todas activas", () => {
		const html = render({ rows: rows(() => "enabled"), connectedAt: "2026-11-04T18:00:00Z" });
		expect(html).toContain("Conectado");
		expect(html).toContain("Desconectar");
		expect(html).toContain("<table");
		expect(html).toContain(`${SUBSCRIPTIONS.length} de ${SUBSCRIPTIONS.length}`);
		expect(html).not.toContain("Reactivar");
		expect(html).not.toContain("Twitch ha revocado");
	});

	it("revocada: el aviso arriba y «Reactivar» en su fila, como único principal", () => {
		const html = render({ rows: rows((t) => (t === "channel.raid" ? "revoked" : "enabled")) });
		expect(html).toContain("Twitch ha revocado una suscripción");
		expect(html).toContain("Revocada");
		expect(html.match(/Reactivar/g)).toHaveLength(1);
		expect(html.indexOf("Twitch ha revocado")).toBeLessThan(html.indexOf("<table"));
		expect(primaries(html)).toBe(1);
	});
});
