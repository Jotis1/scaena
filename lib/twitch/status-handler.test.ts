import { describe, expect, it } from "vitest";
import { handleStatus } from "./status-handler";

const deps = {
	defaultLogin: "jotis_1",
	status: async (login: string) => (login === "jotis_1" ? { live: false as const } : null),
};

describe("GET /api/status", () => {
	it("devuelve el estado con s-maxage=30", async () => {
		const res = await handleStatus(new Request("http://x/api/status"), deps);
		expect(res.status).toBe(200);
		expect(res.headers.get("cache-control")).toBe("public, s-maxage=30");
		expect(res.headers.get("content-type")).toMatch(/application\/json/);
		expect(await res.json()).toEqual({ live: false });
	});

	it("acepta el canal por parámetro, y 404 sin caché si no es de Scaena", async () => {
		expect((await handleStatus(new Request("http://x/api/status?channel=JOTIS_1"), deps)).status).toBe(
			200,
		);
		const res = await handleStatus(new Request("http://x/api/status?channel=otro"), deps);
		expect(res.status).toBe(404);
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});
