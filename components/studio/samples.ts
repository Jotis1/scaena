// Datos de ejemplo de las vistas previas del estudio (diseño: «Overlays»). Los nombres van entre corchetes: son
// huecos, no personas.
import type { ChatMessage, StreamEventItem } from "@jotis-me/react";

export const SAMPLE_CHAT: ChatMessage[] = [
	{ id: "1", user: "[espectador]", text: "¿Ese cofre no lo habías visto ya?", tone: "sky" },
	{
		id: "2",
		user: "[espectador]",
		text: "Ese jefe tiene pinta de complicado.",
		tone: "emerald",
		badges: ["sub"],
	},
	{ id: "3", user: "[moderador]", text: "Recordad las normas del panel.", tone: "purple", badges: ["mod"] },
	{ id: "4", user: "jotis_1", text: "Vamos a por él. Otra vez.", tone: "brand", badges: ["broadcaster"] },
];

export const SAMPLE_EVENTS: StreamEventItem[] = [
	{ id: "1", type: "raid", user: "[canal]", amount: 1284, time: "hace 1 min" },
	{ id: "2", type: "gift", user: "[espectador]", amount: 5, time: "hace 4 min" },
	{ id: "3", type: "resub", user: "[espectador]", months: 14, time: "hace 9 min" },
	{ id: "4", type: "bits", user: "[espectador]", amount: 500, time: "hace 12 min" },
	{ id: "5", type: "follow", user: "[espectador]", time: "hace 15 min" },
	{ id: "6", type: "follow", user: "[espectador]", time: "hace 18 min" },
	{ id: "7", type: "sub", user: "[espectador]", time: "hace 21 min" },
];
