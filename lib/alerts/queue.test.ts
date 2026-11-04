import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlertQueue, EXIT_MS, type Showing } from "./queue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function record() {
	const log: string[] = [];
	const q = new AlertQueue<string>(
		(s: Showing<string> | null) => log.push(s ? `${s.item}:${s.state}` : "nada"),
		7000,
	);
	return { q, log };
}

describe("cola de alertas", () => {
	it("follow y sub con un segundo de diferencia salen en orden, de una en una", () => {
		const { q, log } = record();
		q.push("follow");
		vi.advanceTimersByTime(1000);
		q.push("sub");
		expect(log).toEqual(["follow:enter"]);

		vi.advanceTimersByTime(6000);
		expect(log).toEqual(["follow:enter", "follow:exit"]);
		vi.advanceTimersByTime(EXIT_MS);
		expect(log).toEqual(["follow:enter", "follow:exit", "sub:enter"]);

		vi.advanceTimersByTime(7000 + EXIT_MS);
		expect(log).toEqual(["follow:enter", "follow:exit", "sub:enter", "sub:exit", "nada"]);
		expect(q.size).toBe(0);
	});

	it("la duración por defecto es de 7 s", () => {
		const log: string[] = [];
		const q = new AlertQueue<string>((s) => log.push(s?.state ?? "nada"));
		q.push("raid");
		vi.advanceTimersByTime(6999);
		expect(log).toEqual(["enter"]);
		vi.advanceTimersByTime(1);
		expect(log).toEqual(["enter", "exit"]);
	});

	it("una alerta nueva tras vaciarse la cola entra al momento", () => {
		const { q, log } = record();
		q.push("a");
		vi.advanceTimersByTime(7000 + EXIT_MS);
		q.push("b");
		expect(log.at(-1)).toBe("b:enter");
	});
});
