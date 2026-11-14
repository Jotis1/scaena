// Qué fuentes lleva cada escena en OBS, en orden de capas de arriba abajo, con su caja en píxeles del lienzo
// elegido (specs/obs-overlays, «Guía de montaje en OBS»). Las cajas salen de `boxes.ts`, las mismas que usan las
// escenas (design.md, decisión 1).
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
				name: "Scaena · Juego",
				source: "Navegador",
				from: "URL de «Juego» en Overlays › Escenas",
				box: full,
			},
			{
				name: "Cámara",
				source: "Dispositivo de captura de vídeo",
				from: "Tu cámara, a 16:9 y sin recortar",
				box: scaleBox(gameCamera(c.width), c.scale),
				mask: true,
			},
			{ name: "Juego", source: "Captura de juego", from: "El juego, a pantalla completa", box: full },
		];
	if (scene === "chatting")
		return [
			{
				name: "Scaena · Just Chatting",
				source: "Navegador",
				from: "URL de «Just Chatting» en Overlays › Escenas",
				box: full,
			},
			{
				name: "Cámara",
				source: "Dispositivo de captura de vídeo",
				from: "Tu cámara, a 16:9 y sin recortar",
				box: scaleBox(CAMERA_HOLE, c.scale),
			},
		];
	return [
		{
			name: "Scaena · Empezando (o la que toque)",
			source: "Navegador",
			from: "URL de «Empezando», «Vuelvo enseguida», «Final» u «Offline»",
			box: full,
		},
	];
}

export const position = (b: Box) => `x ${b.x} · y ${b.y}`;
export const size = (b: Box) => `${b.width} × ${b.height}`;

/** La máscara de la cámara (`app/(web)/studio/(app)/guide/camera-mask.png/route.tsx`). */
export const MASK_HREF = "/studio/guide/camera-mask.png";
