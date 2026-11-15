import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { eventsNotice } from "@/lib/studio/connection";
import { SUBSCRIPTIONS } from "@/lib/twitch/eventsub/normalize";
import { EventsBand } from "./EventsNotice";

// specs/twitch-events, «Aviso de eventos sin conectar». En las e2e no hay Twitch, así que el aviso no sale allí: la
// franja y su sitio en cada página se comprueban aquí.
describe("franja del aviso de eventos", () => {
	it("sin conectar: «Eventos sin conectar» con «Conectar eventos», que lleva a la conexión", () => {
		const notice = eventsNotice(SUBSCRIPTIONS.map(({ type }) => ({ type, state: "missing" })));
		if (!notice) throw new Error("sin aviso");
		const html = renderToStaticMarkup(<EventsBand notice={notice} />);
		expect(html).toContain('data-band="events"');
		expect(html).toContain("Eventos sin conectar");
		expect(html).toMatch(/href="\/studio\/connection"[^>]*>.*Conectar eventos/s);
	});

	it("va antes del contenido en Overlays, Guía y Recursos, y no en Conexión", () => {
		const page = (p: string) => readFileSync(`app/(web)/studio/(app)/${p}/page.tsx`, "utf8");
		for (const p of ["overlays", "guide", "assets"]) {
			const src = page(p);
			expect(src.indexOf("<EventsNotice"), p).toBeGreaterThan(0);
			expect(src.indexOf("<EventsNotice"), p).toBeLessThan(src.indexOf("<StudioContent"));
		}
		expect(page("connection")).not.toContain("<EventsNotice");
	});
});
