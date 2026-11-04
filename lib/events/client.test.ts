import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectEvents, eventsUrl } from "./client";

/** `EventSource` falso: se controla a mano qué recibe y cuándo falla. */
class FakeSource extends EventTarget {
	static CONNECTING = 0;
	static OPEN = 1;
	static CLOSED = 2;
	static all: FakeSource[] = [];
	readyState = FakeSource.CONNECTING;
	constructor(public url: string) {
		super();
		FakeSource.all.push(this);
	}
	emit(type: string, data: object, id = "") {
		this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data), lastEventId: id }));
	}
	fail(closed: boolean) {
		this.readyState = closed ? FakeSource.CLOSED : FakeSource.CONNECTING;
		this.dispatchEvent(new Event("error"));
	}
	close() {
		this.readyState = FakeSource.CLOSED;
	}
}

const ES = FakeSource as unknown as typeof EventSource;
const URL_ = eventsUrl("http://localhost", { channel: "jotis1", token: "t" });

beforeEach(() => {
	FakeSource.all = [];
	vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("cliente de eventos", () => {
	it("pasa alertas y ajustes", () => {
		const alerts: string[] = [];
		const settings: unknown[] = [];
		connectEvents(
			URL_,
			{ onAlert: (e) => alerts.push(e.user), onSettings: (s) => settings.push(s) },
			{ EventSource: ES },
		);
		FakeSource.all[0]?.emit("settings", { alerts: { follow: "Hola" } });
		FakeSource.all[0]?.emit("alert", { user: "Ana" }, "1-0");
		expect(alerts).toEqual(["Ana"]);
		expect(settings).toEqual([{ alerts: { follow: "Hola" } }]);
	});

	it("ante un 401 no reintenta", async () => {
		const unauthorized = vi.fn();
		const fetch = vi.fn(async () => new Response("", { status: 401 }));
		connectEvents(URL_, { onUnauthorized: unauthorized }, { EventSource: ES, fetch });
		FakeSource.all[0]?.fail(true);
		await vi.runAllTimersAsync();
		expect(unauthorized).toHaveBeenCalledOnce();
		expect(FakeSource.all).toHaveLength(1);
	});

	it("ante otro error vuelve a abrir desde el último id", async () => {
		const fetch = vi.fn(async () => new Response("", { status: 502 }));
		connectEvents(URL_, {}, { EventSource: ES, fetch });
		FakeSource.all[0]?.emit("alert", { user: "Ana" }, "5-0");
		FakeSource.all[0]?.fail(true);
		await vi.advanceTimersByTimeAsync(1000);
		expect(FakeSource.all).toHaveLength(2);
		expect(new URL(FakeSource.all[1]?.url ?? "").searchParams.get("lastEventId")).toBe("5-0");
	});

	it("si EventSource ya está reconectando, no abre otro", async () => {
		const fetch = vi.fn();
		connectEvents(URL_, {}, { EventSource: ES, fetch });
		FakeSource.all[0]?.fail(false);
		await vi.runAllTimersAsync();
		expect(fetch).not.toHaveBeenCalled();
		expect(FakeSource.all).toHaveLength(1);
	});
});
