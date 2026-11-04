// De un mensaje del chat de Twitch al `ChatMessage` de Regula (specs/twitch-chat, «Insignias y tono por rol»).
import type { ChatMessage, ChatTone } from "@jotis-me/react";
import type { ChatEvent } from "./parser";

type Badge = NonNullable<ChatMessage["badges"]>[number];
export type ChatMessageEvent = Extract<ChatEvent, { type: "message" }>;

/** De mayor a menor rango; `founder` cuenta como suscriptor y `bits-leader`, como bits. */
const PRIORITY: [Badge, string[]][] = [
	["broadcaster", ["broadcaster"]],
	["mod", ["moderator"]],
	["vip", ["vip"]],
	["sub", ["subscriber", "founder"]],
	["bits", ["bits", "bits-leader"]],
];

/** Como mucho tres insignias de Regula, por orden de rango (la ficha de `ChatBox` no admite más). */
export function toRegulaBadges(fromTwitch: string[]): Badge[] {
	const has = new Set(fromTwitch);
	return PRIORITY.filter(([, names]) => names.some((n) => has.has(n)))
		.map(([kind]) => kind)
		.slice(0, 3);
}

/** Tonos para nombres: todos menos `neutral`, que es el de "sin tono". El color elegido en Twitch no se usa. */
export const TONES: ChatTone[] = ["brand", "sky", "emerald", "pink", "purple", "orange", "indigo"];

/** FNV-1a de 32 bits: el mismo usuario cae siempre en el mismo tono. */
function hash(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

export function toneFor(user: string): ChatTone {
	return TONES[hash(user) % TONES.length] as ChatTone;
}

/** Mensaje listo para `ChatBox`. El texto se queda como `string`: Regula lo pinta tal cual, nunca como HTML. */
export function toChatMessage(m: ChatMessageEvent): ChatMessage {
	return {
		id: m.id || undefined,
		user: m.displayName,
		text: m.text,
		tone: toneFor(m.userId || m.login),
		badges: toRegulaBadges(m.badges),
	};
}
