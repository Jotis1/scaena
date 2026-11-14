// Medidas de las escenas montadas en el lienzo lógico (`width` × 1080). Las usan los layouts para colocar las piezas
// y la guía de OBS para decir dónde va cada fuente, así que no pueden separarse (specs/obs-overlays, «Guía de
// montaje en OBS»). Sin JSX ni dependencias, para que también las lean las e2e.

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Alto del lienzo lógico; el mismo que `SCENE_HEIGHT` de `lib/overlay/canvas.ts`. */
const HEIGHT = 1080;

/** Radio de `CamFrame` (`rounded-2xl`). */
export const CAMERA_RADIUS = 16;
const GAME_CAMERA_WIDTH = 384;
/** Radio del marco sobre su ancho en la escena de juego: 16 en 384. La máscara de OBS usa esta proporción. */
export const CAMERA_RADIUS_RATIO = CAMERA_RADIUS / GAME_CAMERA_WIDTH;

/** Margen de las piezas de la escena de juego con el borde (`12` de Tailwind). */
export const GAME_MARGIN = 48;

/** Cámara de la escena de juego: 384 × 216 (16:9), pegada abajo a la derecha. */
export function gameCamera(width = 1920): Box {
	const w = GAME_CAMERA_WIDTH;
	const h = (w * 9) / 16;
	return { x: width - GAME_MARGIN - w, y: HEIGHT - GAME_MARGIN - h, width: w, height: h };
}

/** Hueco de la cámara en Just Chatting: 1216 × 684 en (64, 112). Va a la izquierda: no depende del ancho. */
export const CAMERA_HOLE = { x: 64, y: 112, width: 1216, height: 684, radius: CAMERA_RADIUS };

/** Una caja del lienzo lógico en píxeles de OBS, con la escala del lienzo (1 o 4/3), redondeada. */
export function scaleBox(b: Box, scale: number): Box {
	return {
		x: Math.round(b.x * scale),
		y: Math.round(b.y * scale),
		width: Math.round(b.width * scale),
		height: Math.round(b.height * scale),
	};
}
