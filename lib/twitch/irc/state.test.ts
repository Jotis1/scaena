import { describe, expect, it } from "vitest";
import type { ChatEvent } from "./parser";
import { type ChatOptions, type ChatState, initialChatState, reduceChat, visibleMessages } from "./state";

const options: ChatOptions = { channel: "jotis1", hidden: ["nightbot"] };

let n = 0;
function msg(data: Partial<Extract<ChatEvent, { type: "message" }>> = {}): ChatEvent {
	n++;
	return {
		type: "message",
		channel: "jotis1",
		id: `m${n}`,
		userId: `u${n}`,
		login: `user${n}`,
		displayName: `User${n}`,
		text: `mensaje ${n}`,
		action: false,
		badges: [],
		...data,
	};
}

const apply = (events: ChatEvent[], state: ChatState = initialChatState) =>
	events.reduce((s, e) => reduceChat(s, e, options), state);
const texts = (s: ChatState) => visibleMessages(s).map((m) => m.text);

describe("estado del chat", () => {
	it("del más antiguo al más reciente", () => {
		expect(texts(apply([msg({ text: "primero" }), msg({ text: "segundo" })]))).toEqual([
			"primero",
			"segundo",
		]);
	});

	it("con el decimotercero, el más antiguo deja de verse", () => {
		const events = Array.from({ length: 13 }, (_, i) => msg({ text: `t${i + 1}` }));
		const t = texts(apply(events));
		expect(t).toHaveLength(12);
		expect(t[0]).toBe("t2");
		expect(t.at(-1)).toBe("t13");
	});

	it("un mensaje borrado desaparece", () => {
		const s = apply([
			msg({ id: "borrame" }),
			msg(),
			{ type: "deleteMessage", channel: "jotis1", id: "borrame" },
		]);
		expect(visibleMessages(s)).toHaveLength(1);
		expect(visibleMessages(s).some((m) => m.id === "borrame")).toBe(false);
	});

	it("al banear a un usuario desaparecen sus tres mensajes", () => {
		const from = (text: string) => msg({ userId: "malo", login: "malo", text });
		const s = apply([
			from("uno"),
			msg({ text: "otro" }),
			from("dos"),
			from("tres"),
			{ type: "deleteUser", channel: "jotis1", userId: "malo" },
		]);
		expect(texts(s)).toEqual(["otro"]);
	});

	it("limpiar el chat lo vacía", () => {
		expect(visibleMessages(apply([msg(), msg(), { type: "clear", channel: "jotis1" }]))).toEqual([]);
	});

	it("ni comandos ni usuarios ocultos: «!horario» y la respuesta del bot no salen", () => {
		const s = apply([
			msg({ text: "!horario" }),
			msg({ login: "nightbot", text: "Suele ser de 17:00 a 20:00." }),
			msg({ text: "  !so alguien" }),
			msg({ text: "esto sí" }),
		]);
		expect(texts(s)).toEqual(["esto sí"]);
	});

	it("ignora eventos de otros canales", () => {
		const s = apply([msg({ channel: "otro" }), { type: "clear", channel: "otro" }, msg({ text: "mío" })]);
		expect(texts(s)).toEqual(["mío"]);
	});

	it("un mensaje que llega dos veces se ve una", () => {
		const a = msg({ id: "dup" });
		expect(visibleMessages(apply([a, a]))).toHaveLength(1);
	});

	it("PING y RECONNECT no cambian lo que se ve", () => {
		const s = apply([msg()]);
		expect(reduceChat(s, { type: "ping", token: "x" }, options)).toBe(s);
		expect(reduceChat(s, { type: "reconnect" }, options)).toBe(s);
	});
});
