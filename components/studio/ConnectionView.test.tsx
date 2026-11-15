import { Table } from "@jotis-me/react";
import { isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TWITCH_SCOPES } from "@/lib/auth";
import { SUBSCRIPTIONS } from "@/lib/twitch/eventsub/normalize";
import type { ConnectionStatus, SubscriptionRow } from "@/lib/twitch/eventsub/subscriptions";
import { ConnectionUnreachable, ConnectionView } from "./ConnectionView";

// «Volver a intentar» usa el router de Next, que aquí no está montado.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));

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
		expect(html).toContain("Saber quién empieza a seguir el canal");
		expect(html).toContain("Solo lectura");
		expect(html).not.toContain("<table");
		expect(primaries(html)).toBe(1);
	});

	it("conectado: la cuenta, la barra de activas, «Desconectar» y la tabla con todas activas", () => {
		const html = render({ rows: rows(() => "enabled"), connectedAt: "2026-11-04T18:00:00Z" });
		expect(html).toContain("Desconectar");
		expect(html).toContain("<table");
		expect(html).toContain(`${SUBSCRIPTIONS.length} de ${SUBSCRIPTIONS.length}`);
		expect(html).toContain("Eventos conectados desde el");
		expect(html).toContain(`Suscripciones activas: ${SUBSCRIPTIONS.length} de ${SUBSCRIPTIONS.length}`);
		expect(html).toContain("Alimenta");
		expect(html).toContain("Alertas, eventos y meta");
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

	it("Twitch no responde: el error con «Volver a intentar» y la cuenta con «Desconectar»", () => {
		const html = renderToStaticMarkup(<ConnectionUnreachable name="jotis_1" disconnect={noop} />);
		expect(html).toContain("No se puede leer el estado en Twitch");
		expect(html).toContain("Volver a intentar");
		expect(html).toContain("Desconectar");
		expect(html).not.toContain("<table");
	});

	// ConnectionView se pinta en el servidor y `Table` es de cliente: sus props no pueden llevar funciones (en
	// producción, «Functions cannot be passed directly to Client Components»). renderToStaticMarkup no lo detecta.
	it("a la tabla no le llegan funciones", () => {
		const tree = ConnectionView({
			status: { rows: rows((t) => (t === "channel.raid" ? "revoked" : "enabled")) },
			name: "jotis_1",
			connect: noop,
			disconnect: noop,
		});
		const table = findTable(tree);
		if (!table) throw new Error("no hay tabla");
		const { columns, rows: tableRows } = table.props as { columns: object[]; rows: object[] };
		for (const c of [...columns, ...tableRows])
			for (const [k, v] of Object.entries(c)) expect(typeof v, k).not.toBe("function");
	});
});

function findTable(node: unknown): ReactElement<Record<string, unknown>> | undefined {
	if (Array.isArray(node)) return node.map(findTable).find(Boolean);
	if (!isValidElement<Record<string, unknown>>(node)) return undefined;
	if (node.type === Table) return node;
	return findTable(node.props.children);
}
