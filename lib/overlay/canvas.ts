// Lienzos de las escenas (specs/obs-overlays, «Lienzo de emisión»; design.md, decisión 7). Cada lienzo es un lienzo
// lógico de 1080 de alto escalado: 3440×1440 es 2580×1080 a 4/3, así las piezas conservan su tamaño respecto a la altura
// y el ancho que sobra va al centro. Sin `canvas`, o con uno que no se reconoce, 1920×1080.
import { createElement, type ReactNode } from "react";
import { oneOf, type SearchParams } from "./params";

export const SCENE_HEIGHT = 1080;

export const CANVASES = {
	"1920x1080": { width: 1920, scale: 1 },
	"3440x1440": { width: 2580, scale: 4 / 3 },
} as const;

export type CanvasId = keyof typeof CANVASES;
export const CANVAS_IDS = Object.keys(CANVASES) as CanvasId[];
export const DEFAULT_CANVAS: CanvasId = "1920x1080";

export interface Canvas {
	id: CanvasId;
	/** Ancho del lienzo lógico; el alto es siempre 1080. */
	width: number;
	scale: number;
}

export function canvasById(id: CanvasId): Canvas {
	return { id, ...CANVASES[id] };
}

/** El lienzo de `canvas` en la URL; si falta o no se reconoce, 1920×1080. */
export function canvasOf(q: SearchParams): Canvas {
	return canvasById(oneOf(q, "canvas", CANVAS_IDS, DEFAULT_CANVAS));
}

/** Tamaño real en píxeles: «3440 × 1440». */
export function canvasLabel(c: Canvas): string {
	return `${Math.round(c.width * c.scale)} × ${Math.round(SCENE_HEIGHT * c.scale)}`;
}

/**
 * Pinta el lienzo lógico (`width` × 1080) escalado a su tamaño real, con el origen arriba a la izquierda. Para las
 * escenas montadas; las de pantalla completa ya lo hacen con `StreamScene width scale`.
 */
export function SceneCanvas({ canvas, children }: { canvas: Canvas; children: ReactNode }) {
	const { width, scale } = canvas;
	return createElement(
		"div",
		{
			"data-canvas": canvas.id,
			className: "relative overflow-hidden",
			style: { width: width * scale, height: SCENE_HEIGHT * scale },
		},
		createElement(
			"div",
			{
				className: "absolute top-0 left-0 origin-top-left",
				style: {
					width,
					height: SCENE_HEIGHT,
					transform: scale === 1 ? undefined : `scale(${scale})`,
				},
			},
			children,
		),
	);
}
