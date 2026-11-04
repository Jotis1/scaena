"use client";

import { ChatBox } from "@jotis-me/react";
import { useEffect, useReducer } from "react";
import { connectChat, TWITCH_CHAT_URL } from "@/lib/twitch/irc/client";
import type { ChatEvent } from "@/lib/twitch/irc/parser";
import { initialChatState, reduceChat, visibleMessages } from "@/lib/twitch/irc/state";

export interface LiveChatProps {
	channel: string;
	hidden: string[];
	width: number;
	height: number;
	translucent: boolean;
	fade: boolean;
	animate: boolean;
}

// En producción, siempre el chat de Twitch. Solo los tests la cambian, al construir.
const CHAT_URL = process.env.NEXT_PUBLIC_TWITCH_IRC_URL || TWITCH_CHAT_URL;

/** Overlay de chat (specs/twitch-chat): lee el chat del canal y lo pinta con `ChatBox`. */
export function LiveChat({ channel, hidden, ...view }: LiveChatProps) {
	const [state, dispatch] = useReducer(
		(s: typeof initialChatState, e: ChatEvent) => reduceChat(s, e, { channel, hidden }),
		initialChatState,
	);

	useEffect(() => {
		const client = connectChat({ channel, url: CHAT_URL, onEvent: dispatch });
		return () => client.close();
	}, [channel]);

	return <ChatBox messages={visibleMessages(state)} {...view} />;
}
