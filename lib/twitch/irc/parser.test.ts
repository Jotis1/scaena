import { describe, expect, it } from "vitest";
import { parseChunk, parseLine, toChatEvent, unescapeTagValue } from "./parser";

// Líneas con el formato de la documentación de Twitch (https://dev.twitch.tv/docs/chat/irc/).
const PRIVMSG =
	"@badge-info=subscriber/14;badges=moderator/1,subscriber/12;client-nonce=459e3142897c7a22b7d275178f2259e0;color=#0000FF;display-name=Ronni;emotes=;first-msg=0;flags=;id=885196de-cb67-427a-baa8-82f9b0fcd05f;mod=1;room-id=713936733;subscriber=1;tmi-sent-ts=1643904084794;turbo=0;user-id=87654321;user-type=mod :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #jotis1 :Hay un cofre detrás de la roca, fijo.";
const ACTION =
	"@badges=;display-name=Ana;id=11111111-0000-0000-0000-000000000001;user-id=1001 :ana!ana@ana.tmi.twitch.tv PRIVMSG #jotis1 :\u0001ACTION saluda\u0001";
const CLEARMSG =
	"@login=ronni;room-id=;target-msg-id=885196de-cb67-427a-baa8-82f9b0fcd05f;tmi-sent-ts=1642720582342 :tmi.twitch.tv CLEARMSG #jotis1 :Hay un cofre detrás de la roca, fijo.";
const BAN =
	"@ban-duration=350;room-id=713936733;target-user-id=87654321;tmi-sent-ts=1642719320727 :tmi.twitch.tv CLEARCHAT #jotis1 :ronni";
const CLEAR = "@room-id=713936733;tmi-sent-ts=1642715695392 :tmi.twitch.tv CLEARCHAT #jotis1";

describe("unescapeTagValue", () => {
	it("traduce los escapes de IRCv3", () => {
		expect(unescapeTagValue(String.raw`Hola\squé\stal\:\\fin\r\n`)).toBe("Hola qué tal;\\fin\r\n");
	});
	it("una barra al final se descarta y un escape desconocido deja el carácter", () => {
		expect(unescapeTagValue(String.raw`a\x`)).toBe("ax");
		expect(unescapeTagValue("a\\")).toBe("a");
	});
});

describe("parseLine", () => {
	it("separa etiquetas, prefijo, comando y parámetros", () => {
		const l = parseLine(PRIVMSG);
		expect(l?.command).toBe("PRIVMSG");
		expect(l?.nick).toBe("ronni");
		expect(l?.params).toEqual(["#jotis1", "Hay un cofre detrás de la roca, fijo."]);
		expect(l?.tags["display-name"]).toBe("Ronni");
		expect(l?.tags.emotes).toBe("");
	});

	it("desescapa los valores de las etiquetas", () => {
		const l = parseLine(String.raw`@system-msg=5\sraiders\sfrom\sx\:y :tmi.twitch.tv USERNOTICE #jotis1`);
		expect(l?.tags["system-msg"]).toBe("5 raiders from x;y");
	});

	it("un texto final con dos puntos y espacios se conserva entero", () => {
		const l = parseLine(":a!a@a PRIVMSG #jotis1 :hora: 17:00 :)");
		expect(l?.params[1]).toBe("hora: 17:00 :)");
	});

	it("ignora líneas vacías o sin comando", () => {
		expect(parseLine("")).toBeNull();
		expect(parseLine("@solo=etiquetas")).toBeNull();
	});
});

describe("toChatEvent", () => {
	it("PRIVMSG → mensaje con insignias, nombre e ids", () => {
		const e = toChatEvent(parseLine(PRIVMSG) as NonNullable<ReturnType<typeof parseLine>>);
		expect(e).toEqual({
			type: "message",
			channel: "jotis1",
			id: "885196de-cb67-427a-baa8-82f9b0fcd05f",
			userId: "87654321",
			login: "ronni",
			displayName: "Ronni",
			text: "Hay un cofre detrás de la roca, fijo.",
			action: false,
			badges: ["moderator", "subscriber"],
		});
	});

	it("/me llega sin el envoltorio ACTION", () => {
		const [e] = parseChunk(ACTION);
		expect(e).toMatchObject({ type: "message", text: "saluda", action: true, displayName: "Ana" });
	});

	it("CLEARMSG, CLEARCHAT con usuario y CLEARCHAT sin usuario", () => {
		expect(parseChunk(CLEARMSG)).toEqual([
			{ type: "deleteMessage", channel: "jotis1", id: "885196de-cb67-427a-baa8-82f9b0fcd05f" },
		]);
		expect(parseChunk(BAN)).toEqual([{ type: "deleteUser", channel: "jotis1", userId: "87654321" }]);
		expect(parseChunk(CLEAR)).toEqual([{ type: "clear", channel: "jotis1" }]);
	});

	it("PING y RECONNECT", () => {
		expect(parseChunk("PING :tmi.twitch.tv")).toEqual([{ type: "ping", token: "tmi.twitch.tv" }]);
		expect(parseChunk(":tmi.twitch.tv RECONNECT")).toEqual([{ type: "reconnect" }]);
	});

	it("un bloque con varias líneas da varios eventos e ignora lo que no interesa", () => {
		const chunk = [
			":tmi.twitch.tv 001 justinfan123 :Welcome, GLHF!",
			":tmi.twitch.tv CAP * ACK :twitch.tv/tags twitch.tv/commands",
			PRIVMSG,
			"PING :tmi.twitch.tv",
			"",
		].join("\r\n");
		expect(parseChunk(chunk).map((e) => e.type)).toEqual(["message", "ping"]);
	});
});
