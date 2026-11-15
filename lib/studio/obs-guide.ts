// Qué fuentes lleva cada escena en OBS, en orden de capas de arriba abajo, con su caja en píxeles del lienzo
// elegido (specs/obs-overlays, «Guía de montaje en OBS»). Las cajas salen de `boxes.ts`, las mismas que usan las
// escenas (design.md, decisión 1).

import { formatNumber } from "@jotis-me/react";
import { type Box, CAMERA_HOLE, gameCamera, scaleBox } from "@/components/overlay/scenes/boxes";
import { type Canvas, SCENE_HEIGHT } from "@/lib/overlay/canvas";

export type GuideScene = "game" | "chatting" | "fullscreen";

export interface GuideLayer {
	/** Nombre de la fuente en OBS. */
	name: string;
	/** Tipo de fuente de OBS. */
	source: string;
	/** De dónde sale: la tarjeta de Overlays o lo que se capture. */
	from: string;
	box: Box;
	/** Lleva la máscara de esquinas. */
	mask?: boolean;
}

export function canvasBox(c: Canvas): Box {
	return scaleBox({ x: 0, y: 0, width: c.width, height: SCENE_HEIGHT }, c.scale);
}

export function guideLayers(scene: GuideScene, c: Canvas): GuideLayer[] {
	const full = canvasBox(c);
	if (scene === "game")
		return [
			{
				name: "Escena de juego",
				source: "Navegador",
				from: "Scaena - Overlays › Escenas › Juego",
				box: full,
			},
			{
				name: "Cámara",
				source: "Dispositivo de captura de vídeo",
				from: "La tuya, con la máscara de abajo",
				box: scaleBox(gameCamera(c.width), c.scale),
				mask: true,
			},
			{ name: "Juego", source: "Captura de juego", from: "La captura del juego", box: full },
		];
	if (scene === "chatting")
		return [
			{
				name: "Escena Just Chatting",
				source: "Navegador",
				from: "Scaena - Overlays › Escenas › Just Chatting",
				box: full,
			},
			{
				name: "Cámara",
				source: "Dispositivo de captura de vídeo",
				from: "La tuya, sin máscara",
				box: scaleBox(CAMERA_HOLE, c.scale),
			},
		];
	return [
		{
			name: "Empezando, vuelvo enseguida, final u offline",
			source: "Navegador",
			from: "Scaena - Overlays › Escenas",
			box: full,
		},
	];
}

/** Posición para OBS, con las cifras en formato español: «1.488, 816». */
export const position = (b: Box) => `${formatNumber(b.x)}, ${formatNumber(b.y)}`;
export const size = (b: Box) => `${formatNumber(b.width)} × ${formatNumber(b.height)}`;

/**
 * La cámara de una escena montada en el esquema de la guía, en % del lienzo (diseño: «Guía de OBS»). Sale de las mismas
 * cajas que la tabla, en el lienzo lógico: la escala no cambia las proporciones.
 */
export function cameraDiagram(scene: "game" | "chatting", c: Canvas): Box {
	const b = scene === "game" ? gameCamera(c.width) : CAMERA_HOLE;
	const pct = (n: number, of: number) => Math.round((n / of) * 10000) / 100;
	return {
		x: pct(b.x, c.width),
		y: pct(b.y, SCENE_HEIGHT),
		width: pct(b.width, c.width),
		height: pct(b.height, SCENE_HEIGHT),
	};
}

/** La máscara de la cámara (`app/(web)/studio/(app)/guide/camera-mask.png/route.tsx`). */
export const MASK_HREF = "/studio/guide/camera-mask.png";
