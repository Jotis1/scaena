import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocketServer, type WebSocket as WsSocket } from "ws";
import { type ChatClient, connectChat } from "./client";
import type { ChatEvent } from "./parser";
import { initialChatState, reduceChat, visibleMessages } from "./state";

// Servidor WebSocket falso que habla como el chat de Twitch.
function fakeServer() {
	const wss = new WebSocketServer({ port: 0 });
	const connections: WsSocket[] = [];
	const received: string[][] = [];
	wss.on("connection", (s) => {
		connections.push(s);
		const lines: string[] = [];
		received.push(lines);
		s.on("message", (d) => {
			for (const l of d.toString().split("\r\n").filter(Boolean)) {
				lines.push(l);
				const join = /^JOIN (#\S+)/.exec(l);
				if (join) s.send(`:justinfan!justinfan@justinfan.tmi.twitch.tv JOIN ${join[1]}\r\n`);
			}
		});
	});
	const url = () => `ws://127.0.0.1:${(wss.address() as AddressInfo).port}`;
	const last = () => connections.at(-1) as WsSocket;
	return { wss, connections, received, url, last };
}

const PRIVMSG = (id: string, text: string) =>
	`@badges=;display-name=Ana;id=${id};user-id=1001 :ana!ana@ana.tmi.twitch.tv PRIVMSG #jotis_1 :${text}\r\n`;

async function until(condition: () => boolean, ms = 3000) {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > ms) throw new Error("tiempo agotado esperando la condición");
		await new Promise((r) => setTimeout(r, 10));
	}
}

let server: ReturnType<typeof fakeServer>;
let client: ChatClient | undefined;

afterEach(async () => {
	client?.close();
	for (const c of server.connections) c.terminate();
	await new Promise<void>((r) => server.wss.close(() => r()));
});

describe("cliente del chat", () => {
	it("entra como anónimo con etiquetas y comandos, y se une al canal", async () => {
		server = fakeServer();
		client = connectChat({ channel: "Jotis_1", url: server.url(), onEvent: () => {} });
		await until(() => (server.received[0]?.length ?? 0) >= 4);
		const [cap, pass, nick, join] = server.received[0] as string[];
		expect(cap).toBe("CAP REQ :twitch.tv/tags twitch.tv/commands");
		expect(pass).toBe("PASS SCHMOOPIIE");
		expect(nick).toMatch(/^NICK justinfan\d{5}$/);
		expect(join).toBe("JOIN #jotis_1");
	});

	it("entrega los mensajes y responde a PING", async () => {
		server = fakeServer();
		const events: ChatEvent[] = [];
		client = connectChat({ channel: "jotis_1", url: server.url(), onEvent: (e) => events.push(e) });
		await until(() => server.connections.length === 1 && (server.received[0]?.length ?? 0) >= 4);
		server.last().send(`${PRIVMSG("a", "hola")}PING :tmi.twitch.tv\r\n`);
		await until(
			() => events.length === 1 && server.received[0]?.includes("PONG :tmi.twitch.tv") === true,
		);
		expect(events[0]).toMatchObject({ type: "message", text: "hola" });
	});

	it("si el servidor corta, se reconecta y conserva los mensajes que ya se veían", async () => {
		server = fakeServer();
		let state = initialChatState;
		const states: string[] = [];
		client = connectChat({
			channel: "jotis_1",
			url: server.url(),
			backoff: [50, 100],
			onEvent: (e) => {
				state = reduceChat(state, e, { channel: "jotis_1", hidden: [] });
			},
			onState: (s) => states.push(s),
		});
		await until(() => (server.received[0]?.length ?? 0) >= 4);
		server.last().send(PRIVMSG("a", "antes del corte"));
		await until(() => visibleMessages(state).length === 1);

		server.last().terminate();
		await until(() => server.connections.length === 2 && (server.received[1]?.length ?? 0) >= 4);
		server.last().send(PRIVMSG("b", "después del corte"));
		await until(() => visibleMessages(state).length === 2);

		expect(visibleMessages(state).map((m) => m.text)).toEqual(["antes del corte", "después del corte"]);
		expect(server.received[1]?.at(-1)).toBe("JOIN #jotis_1");
		expect(states).toContain("disconnected");
		expect(states.at(-1)).toBe("connected");
	});

	it("con RECONNECT vuelve a conectar sin esperar", async () => {
		server = fakeServer();
		client = connectChat({ channel: "jotis_1", url: server.url(), backoff: [60_000], onEvent: () => {} });
		await until(() => (server.received[0]?.length ?? 0) >= 4);
		server.last().send(":tmi.twitch.tv RECONNECT\r\n");
		await until(() => server.connections.length === 2, 1000);
	});

	it("tras unirse, la primera caída espera la primera espera", async () => {
		server = fakeServer();
		client = connectChat({
			channel: "jotis_1",
			url: server.url(),
			backoff: [40, 400],
			onEvent: () => {},
		});
		await until(() => (server.received[0]?.length ?? 0) >= 4);
		const t0 = Date.now();
		server.last().terminate();
		await until(() => server.connections.length === 2);
		expect(Date.now() - t0).toBeLessThan(350);
	});

	it("si no llega a unirse, cada espera es más larga que la anterior", async () => {
		server = fakeServer();
		const arrivals: number[] = [];
		// Este servidor corta cada conexión nada más aceptarla: el cliente nunca llega a unirse.
		server.wss.removeAllListeners("connection");
		server.wss.on("connection", (s) => {
			arrivals.push(Date.now());
			s.terminate();
		});
		client = connectChat({
			channel: "jotis_1",
			url: server.url(),
			backoff: [40, 400],
			onEvent: () => {},
		});
		await until(() => arrivals.length === 3, 3000);
		const [a, b, c] = arrivals as [number, number, number];
		expect(b - a).toBeLessThan(300);
		expect(c - b).toBeGreaterThanOrEqual(380);
	});

	it("cerrar no deja reconexiones pendientes", async () => {
		server = fakeServer();
		client = connectChat({ channel: "jotis_1", url: server.url(), backoff: [20], onEvent: () => {} });
		await until(() => server.connections.length === 1);
		client.close();
		await new Promise((r) => setTimeout(r, 150));
		expect(server.connections.length).toBe(1);
	});
});
