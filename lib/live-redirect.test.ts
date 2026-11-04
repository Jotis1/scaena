import { describe, expect, it } from "vitest";
import { liveRedirect } from "./live-redirect";

const LIVE = {
	live: true as const,
	title: "t",
	category: "c",
	viewers: 1,
	startedAt: "2026-11-04T17:00:00Z",
};

describe("/live", () => {
	it("en directo, 302 a twitch.tv/<canal> sin caché", () => {
		const r = liveRedirect(LIVE, "jotis1", "https://scaena.jotis.me");
		expect(r.status).toBe(302);
		expect(r.headers.get("location")).toBe("https://www.twitch.tv/jotis1");
		expect(r.headers.get("cache-control")).toBe("no-store");
	});

	it("sin directo, a la portada en el horario", () => {
		const r = liveRedirect({ live: false }, "jotis1", "https://scaena.jotis.me");
		expect(r.status).toBe(302);
		expect(r.headers.get("location")).toBe("https://scaena.jotis.me/#schedule");
		expect(r.headers.get("cache-control")).toBe("no-store");
	});
});
