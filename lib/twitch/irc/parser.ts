// Analizador de mensajes IRC del chat de Twitch (IRCv3 con etiquetas). Formato:
// https://dev.twitch.tv/docs/chat/irc/  — `@etiquetas :prefijo COMANDO params :texto final`
// Sin dependencias de navegador ni de Node: lo usan el overlay y los tests.

export type Tags = Record<string, string>;

export interface IrcLine {
	tags: Tags;
	/** `nick` del prefijo `nick!user@host`, si lo hay. */
	nick?: string;
	command: string;
	params: string[];
}

export type ChatEvent =
	| {
			type: "message";
			channel: string;
			id: string;
			userId: string;
			login: string;
			displayName: string;
			text: string;
			/** `/me`: el texto viene envuelto en ACTION; aquí ya sin envoltorio. */
			action: boolean;
			badges: string[];
	  }
	| { type: "deleteMessage"; channel: string; id: string }
	| { type: "deleteUser"; channel: string; userId: string }
	| { type: "clear"; channel: string }
	| { type: "ping"; token: string }
	| { type: "reconnect" };

const ESCAPES: Record<string, string> = { ":": ";", s: " ", "\\": "\\", r: "\r", n: "\n" };

/** `Hola\sque\stal\:` → `Hola que tal;` (escapes de valores de etiqueta de IRCv3). */
export function unescapeTagValue(value: string): string {
	return value.replace(/\\(.?)/g, (_, c: string) => (c in ESCAPES ? ESCAPES[c] : c));
}

/** Una línea IRC; `null` si está vacía o no tiene comando. */
export function parseLine(line: string): IrcLine | null {
	let rest = line.replace(/\r?\n$/, "");
	if (!rest.trim()) return null;

	const tags: Tags = {};
	if (rest.startsWith("@")) {
		const end = rest.indexOf(" ");
		if (end === -1) return null;
		for (const pair of rest.slice(1, end).split(";")) {
			if (!pair) continue;
			const eq = pair.indexOf("=");
			const key = eq === -1 ? pair : pair.slice(0, eq);
			tags[key] = eq === -1 ? "" : unescapeTagValue(pair.slice(eq + 1));
		}
		rest = rest.slice(end + 1).trimStart();
	}

	let nick: string | undefined;
	if (rest.startsWith(":")) {
		const end = rest.indexOf(" ");
		if (end === -1) return null;
		const prefix = rest.slice(1, end);
		nick = prefix.includes("!") ? prefix.slice(0, prefix.indexOf("!")) : undefined;
		rest = rest.slice(end + 1).trimStart();
	}

	const params: string[] = [];
	const trailingAt = rest.indexOf(" :");
	const head = trailingAt === -1 ? rest : rest.slice(0, trailingAt);
	const [command, ...middle] = head.split(" ").filter(Boolean);
	if (!command) return null;
	params.push(...middle);
	if (trailingAt !== -1) params.push(rest.slice(trailingAt + 2));
	else if (rest.startsWith(":")) params.push(rest.slice(1));

	return { tags, nick, command: command.toUpperCase(), params };
}

const channelOf = (p?: string) => (p ?? "").replace(/^#/, "").toLowerCase();

/** `broadcaster/1,subscriber/12` → `["broadcaster", "subscriber"]`. */
function badgeNames(value = ""): string[] {
	return value
		.split(",")
		.map((b) => b.split("/")[0] as string)
		.filter(Boolean);
}

/** `/me hola` llega como `\u0001ACTION hola\u0001`; devuelve `hola`, o `null` si no es una acción. */
function actionText(raw: string): string | null {
	const start = "\u0001ACTION ";
	return raw.startsWith(start) && raw.endsWith("\u0001") && raw.length > start.length
		? raw.slice(start.length, -1)
		: null;
}

/** Pasa una línea al evento que le interesa al overlay; `null` si no es ninguno. */
export function toChatEvent(l: IrcLine): ChatEvent | null {
	switch (l.command) {
		case "PING":
			return { type: "ping", token: l.params[0] ?? "tmi.twitch.tv" };
		case "RECONNECT":
			return { type: "reconnect" };
		case "PRIVMSG": {
			const raw = l.params[1] ?? "";
			const action = actionText(raw);
			const login = (l.tags.login ?? l.nick ?? "").toLowerCase();
			return {
				type: "message",
				channel: channelOf(l.params[0]),
				id: l.tags.id ?? "",
				userId: l.tags["user-id"] ?? "",
				login,
				displayName: l.tags["display-name"] || login,
				text: action ?? raw,
				action: action !== null,
				badges: badgeNames(l.tags.badges),
			};
		}
		case "CLEARMSG": {
			const id = l.tags["target-msg-id"];
			return id ? { type: "deleteMessage", channel: channelOf(l.params[0]), id } : null;
		}
		case "CLEARCHAT": {
			const userId = l.tags["target-user-id"];
			return userId
				? { type: "deleteUser", channel: channelOf(l.params[0]), userId }
				: { type: "clear", channel: channelOf(l.params[0]) };
		}
		default:
			return null;
	}
}

/** Un bloque recibido del WebSocket puede traer varias líneas separadas por `\r\n`. */
export function parseChunk(chunk: string): ChatEvent[] {
	return chunk
		.split(/\r?\n/)
		.map(parseLine)
		.flatMap((l) => {
			const e = l ? toChatEvent(l) : null;
			return e ? [e] : [];
		});
}
