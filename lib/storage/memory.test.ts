import { describe, expect, it } from "vitest";
import { memoryStore } from "./memory";

describe("almacén en memoria", () => {
	it("`incrby` parte de 0 si no hay nada, suma y se lee con `get`", async () => {
		const s = memoryStore();
		expect(await s.incrby("k", 5)).toBe(5);
		expect(await s.incrby("k", -2)).toBe(3);
		expect(await s.get("k")).toBe(3);
	});

	it("`incrby` sobre un valor guardado con `set` sigue desde él", async () => {
		const s = memoryStore();
		await s.set("k", 40);
		expect(await s.incrby("k", 3)).toBe(43);
	});

	it("`hdel` borra solo esos campos del hash", async () => {
		const s = memoryStore();
		await s.hset("h", { a: "1", b: "2", c: "3" });
		await s.hdel("h", "a", "c");
		expect(await s.hgetall("h")).toEqual({ b: "2" });
		await s.hdel("otro", "a");
		expect(await s.hgetall("otro")).toEqual({});
	});
});
