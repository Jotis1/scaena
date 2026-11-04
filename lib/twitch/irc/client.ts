// Cliente anónimo del chat de Twitch por WebSocket (design.md, decisión 2). Solo lee: entra como
// `justinfan<n>`, pide etiquetas y comandos y se une al canal. Responde a PING, obedece a RECONNECT y, si la
// conexión se corta, vuelve a conectar con espera creciente. No guarda mensajes: eso lo hace quien lo usa,
// así que una reconexión no borra lo que ya está en pantalla.
import { type ChatEvent, parseChunk } from "./parser";

export const TWITCH_CHAT_URL = "wss://irc-ws.chat.twitch.tv:443";

/** Esperas tras cada caída seguida, en milisegundos: 1, 2, 4, 8 y, desde ahí, 15 s. */
export const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface ChatClientOptions {
	channel: string;
	onEvent: (event: ChatEvent) => void;
	onState?: (state: ConnectionState) => void;
	url?: string;
	backoff?: readonly number[];
	/** Para tests: otra implementación de WebSocket. */
	WebSocketImpl?: typeof WebSocket;
}

export interface ChatClient {
	close(): void;
}

/** Twitch confirma la entrada al canal devolviendo el JOIN o con ROOMSTATE. */
const JOINED = /(?:^|\n)(?:@\S+ )?:\S+ (?:JOIN|ROOMSTATE) #/;

export function connectChat(options: ChatClientOptions): ChatClient {
	const channel = options.channel.toLowerCase().replace(/^#/, "");
	const url = options.url ?? TWITCH_CHAT_URL;
	const backoff = options.backoff ?? BACKOFF_MS;
	const Impl = options.WebSocketImpl ?? WebSocket;

	let ws: WebSocket | undefined;
	let failures = 0;
	let immediate = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let closed = false;

	function open() {
		timer = undefined;
		if (closed) return;
		options.onState?.("connecting");
		const socket = new Impl(url);
		ws = socket;
		const send = (line: string) => {
			if (socket.readyState === Impl.OPEN) socket.send(`${line}\r\n`);
		};

		socket.onopen = () => {
			send("CAP REQ :twitch.tv/tags twitch.tv/commands");
			send("PASS SCHMOOPIIE");
			send(`NICK justinfan${Math.floor(10000 + Math.random() * 89999)}`);
			send(`JOIN #${channel}`);
		};

		socket.onmessage = (m) => {
			const data = typeof m.data === "string" ? m.data : String(m.data);
			if (JOINED.test(data)) {
				failures = 0;
				options.onState?.("connected");
			}
			for (const event of parseChunk(data)) {
				if (event.type === "ping") send(`PONG :${event.token}`);
				else if (event.type === "reconnect") {
					// Twitch avisa antes de cortar: se vuelve a conectar ya, sin esperar.
					immediate = true;
					socket.close();
				} else options.onEvent(event);
			}
		};

		socket.onclose = () => {
			if (ws !== socket) return;
			ws = undefined;
			if (closed) return;
			options.onState?.("disconnected");
			const wait = immediate ? 0 : (backoff[Math.min(failures, backoff.length - 1)] ?? 15000);
			immediate = false;
			failures++;
			timer = setTimeout(open, wait);
		};

		// Tras un error llega `close`, que es quien reconecta.
		socket.onerror = () => {};
	}

	open();

	return {
		close() {
			closed = true;
			if (timer) clearTimeout(timer);
			const socket = ws;
			ws = undefined;
			socket?.close();
		},
	};
}
