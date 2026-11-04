import { describe, expect, it } from "vitest";
import { uptime } from "./uptime";

describe("tiempo en emisión", () => {
	const start = "2026-11-04T17:00:00Z";
	const at = (s: number) => Date.parse(start) + s * 1000;
	it("h:mm:ss pasada la hora", () => expect(uptime(start, at(2 * 3600 + 14 * 60 + 5))).toBe("2:14:05"));
	it("mm:ss en la primera hora", () => expect(uptime(start, at(65))).toBe("01:05"));
	it("nunca negativo", () => expect(uptime(start, at(-30))).toBe("00:00"));
});
