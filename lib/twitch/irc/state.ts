// Estado del overlay de chat (specs/twitch-chat): qué mensajes se ven. Función pura, sin red ni React.
import type { ChatMessage } from "@jotis-me/react";
import { toChatMessage } from "./message";
import type { ChatEvent } from "./parser";

export const MAX_MESSAGES = 12;

interface Visible {
	message: ChatMessage;
	id: string;
	userId: string;
}

export interface ChatState {
	visible: Visible[];
}

export interface ChatOptions {
	/** Canal del overlay, en minúsculas: los eventos de otros canales se ignoran. */
	channel: string;
	/** Logins (en minúsculas) cuyos mensajes no salen; por ejemplo, el bot del canal. */
	hidden: readonly string[];
	max?: number;
}

export const initialChatState: ChatState = { visible: [] };

/** Los comandos de bot (`!horario`) no se enseñan. */
const isCommand = (text: string) => text.trimStart().startsWith("!");

export function reduceChat(state: ChatState, event: ChatEvent, options: ChatOptions): ChatState {
	if ("channel" in event && event.channel !== options.channel) return state;
	switch (event.type) {
		case "message": {
			if (options.hidden.includes(event.login) || isCommand(event.text)) return state;
			if (event.id && state.visible.some((v) => v.id === event.id)) return state;
			const max = options.max ?? MAX_MESSAGES;
			const visible = [
				...state.visible,
				{ message: toChatMessage(event), id: event.id, userId: event.userId },
			];
			return { visible: visible.slice(-max) };
		}
		case "deleteMessage":
			return { visible: state.visible.filter((v) => v.id !== event.id) };
		case "deleteUser":
			return { visible: state.visible.filter((v) => v.userId !== event.userId) };
		case "clear":
			return initialChatState;
		default:
			return state;
	}
}

/** Lo que recibe `ChatBox`: del más antiguo al más reciente. */
export function visibleMessages(state: ChatState): ChatMessage[] {
	return state.visible.map((v) => v.message);
}
