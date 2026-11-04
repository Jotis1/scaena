import { describe, expect, it } from "vitest";
import { getOrCreateToken, rotateToken } from "../overlay/token";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { handleEvents } from "./handler";
import { RECOVERY_MS, sseMessage, startAfter } from "./sse";

const CHANNEL = "1337";
const BASE = "http://localhost/api/events";

function setup(clock = { t: Date.parse("2026-11-04T18:00:00Z") }) {
	const store = memoryStore(() => clock.t);
	const deps = {
		store,
		channelId: async (login: string) => (login === "jotis1" ? CHANNEL : null),
		initial: () => async () => [{ event: "settings", data: '{"alerts":{}}' }],
		stream: { pollMs: 5, heartbeatMs: 20, maxMs: 200, now: () => clock.t },
	};
	const add = (data: object) =>
		store.xadd(keys.channel(CHANNEL, "events"), { type: "alert", data: JSON.stringify(data) });
	return { store, deps, add, clock };
}

/** Lee el flujo hasta que `until` diga basta o se cierre; devuelve el texto y corta la conexión. */
async function read(res: Response, until: (text: string) => boolean = () => false, ms = 1000) {
	const reader = (res.body as ReadableStream<Uint8Array>).getReader();
	const decoder = new TextDecoder();
	let text = "";
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		const r = await Promise.race([
			reader.read(),
			new Promise<{ done: true; value: undefined; timeout: true }>((ok) =>
				setTimeout(() => ok({ done: true, value: undefined, timeout: true }), deadline - Date.now()),
			),
		]);
		if (r.value) text += decoder.decode(r.value);
		if (r.done || until(text)) break;
	}
	await reader.cancel().catch(() => {});
	return text;
}

const ids = (text: string) => [...text.matchAll(/^id: (.+)$/gm)].map((m) => m[1]);
const users = (text: string) => [...text.matchAll(/"user":"([^"]+)"/g)].map((m) => m[1]);

describe("GET /api/events", () => {
	it("401 sin abrir el flujo si el token no vale", async () => {
		const { deps, store } = setup();
		await getOrCreateToken(store, CHANNEL);
		for (const q of ["?channel=jotis1", "?channel=jotis1&token=otro"]) {
			const res = await handleEvents(new Request(BASE + q), deps);
			expect(res.status).toBe(401);
			expect(res.headers.get("content-type")).not.toMatch(/event-stream/);
		}
	});

	it("404 si el canal no es de Scaena y 400 sin canal", async () => {
		const { deps } = setup();
		expect((await handleEvents(new Request(`${BASE}?channel=otro&token=x`), deps)).status).toBe(404);
		expect((await handleEvents(new Request(`${BASE}?token=x`), deps)).status).toBe(400);
	});

	it("manda los ajustes al conectar y cada evento con su id", async () => {
		const { deps, store, add } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		await add({ user: "Ana" });
		const res = await handleEvents(new Request(`${BASE}?channel=jotis1&token=${token}`), deps);
		expect(res.headers.get("content-type")).toMatch(/^text\/event-stream/);
		const text = await read(res, (t) => t.includes("Ana"));
		expect(text).toMatch(/^retry: 2000\n\nevent: settings\ndata: \{"alerts":\{\}\}\n\n/);
		expect(text).toMatch(/id: \d+-0\nevent: alert\ndata: \{"user":"Ana"\}\n\n/);
	});

	it("al reconectar con Last-Event-ID llega lo nuevo una sola vez", async () => {
		const { deps, store, add, clock } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		const url = `${BASE}?channel=jotis1&token=${token}`;
		await add({ user: "Ana" });
		const first = await read(await handleEvents(new Request(url), deps), (t) => t.includes("Ana"));
		const last = ids(first).at(-1) as string;

		// Desconectado: entra un follow.
		clock.t += 30_000;
		await add({ user: "Berta" });

		const again = await read(
			await handleEvents(new Request(url, { headers: { "last-event-id": last } }), deps),
			(t) => t.includes("Berta"),
		);
		expect(users(again)).toEqual(["Berta"]);
	});

	it("sin Last-Event-ID solo manda lo de los últimos 10 minutos", async () => {
		const { deps, store, add, clock } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		await add({ user: "Vieja" });
		clock.t += RECOVERY_MS + 1000;
		await add({ user: "Nueva" });
		const text = await read(
			await handleEvents(new Request(`${BASE}?channel=jotis1&token=${token}`), deps),
			(t) => t.includes("Nueva"),
		);
		expect(users(text)).toEqual(["Nueva"]);
	});

	it("con `since` reproduce desde esa hora (la meta)", async () => {
		const { deps, store, add, clock } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		const since = clock.t;
		await add({ user: "Ana" });
		clock.t += 3 * 60 * 60 * 1000;
		await add({ user: "Berta" });
		const text = await read(
			await handleEvents(new Request(`${BASE}?channel=jotis1&token=${token}&since=${since}`), deps),
			(t) => t.includes("Berta"),
		);
		expect(users(text)).toEqual(["Ana", "Berta"]);
	});

	it("manda latidos y se cierra solo al llegar al límite", async () => {
		const { deps, store, clock } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		const t0 = Date.now();
		const tick = setInterval(() => {
			clock.t += 20;
		}, 5);
		const text = await read(
			await handleEvents(new Request(`${BASE}?channel=jotis1&token=${token}`), deps),
		);
		clearInterval(tick);
		expect(text).toContain(": latido\n\n");
		// Se ha cerrado el servidor, no el tiempo de espera de la lectura (1 s).
		expect(Date.now() - t0).toBeLessThan(900);
	});

	it("al rotar el token, el flujo abierto con el viejo se cierra", async () => {
		const { deps, store, add } = setup();
		const token = await getOrCreateToken(store, CHANNEL);
		const res = await handleEvents(new Request(`${BASE}?channel=jotis1&token=${token}`), {
			...deps,
			stream: { ...deps.stream, maxMs: 60_000 },
		});
		setTimeout(async () => {
			await rotateToken(store, CHANNEL);
			await add({ user: "Tarde" });
		}, 30);
		const t0 = Date.now();
		const text = await read(res, () => false, 2000);
		expect(Date.now() - t0).toBeLessThan(1500);
		expect(users(text)).toEqual([]);
		expect(text).not.toContain("event: token");
	});
});

describe("formato SSE", () => {
	it("parte los datos con saltos de línea", () => {
		expect(sseMessage({ id: "1-0", event: "alert", data: "a\nb" })).toBe(
			"id: 1-0\nevent: alert\ndata: a\ndata: b\n\n",
		);
	});

	it("un Last-Event-ID mal formado cae a los últimos 10 minutos", () => {
		const now = 1_000_000_000;
		expect(startAfter("basura", undefined, now)).toBe(
			`${now - RECOVERY_MS - 1}-${Number.MAX_SAFE_INTEGER}`,
		);
		expect(startAfter("123-4", undefined, now)).toBe("123-4");
	});
});
