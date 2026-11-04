import { describe, expect, it } from "vitest";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { sendTestAlert, TEST_ALERTS } from "./test-alerts";

describe("alertas de prueba", () => {
	it("hay una por tipo, con las etiquetas del diseño", () => {
		expect(TEST_ALERTS.map((t) => t.label)).toEqual([
			"Follow",
			"Sub nivel 1",
			"Renovación - 14 meses",
			"5 subs regaladas",
			"Raid - 1.284",
			"500 bits",
		]);
	});

	it("«Raid - 1.284» mete en el stream un raid de 1.284 marcado como prueba", async () => {
		const store = memoryStore();
		await sendTestAlert(store, "1337", "raid");
		const [e] = await store.xrange(keys.channel("1337", "events"));
		expect(e?.fields.type).toBe("alert");
		expect(JSON.parse(e?.fields.data ?? "{}")).toMatchObject({
			type: "raid",
			amount: 1284,
			test: true,
			channelId: "1337",
		});
	});

	it("un tipo que no existe no mete nada", async () => {
		const store = memoryStore();
		expect(await sendTestAlert(store, "1337", "donation")).toBeNull();
		expect(await store.xrange(keys.channel("1337", "events"))).toEqual([]);
	});
});
