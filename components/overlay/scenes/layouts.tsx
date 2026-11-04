import { BackgroundPattern } from "@jotis-me/react";
import type { ReactNode } from "react";

// Posiciones de las escenas montadas (diseño: «Escena de juego» y «Escena de Just Chatting»). Solo colocan: las
// piezas llegan hechas, en vivo en el overlay (GameScene, ChattingScene) o con datos de ejemplo en la vista previa
// del estudio. Así las dos cosas no se separan nunca. Una pieza `null` no deja hueco.

export interface SceneSlots {
	status: ReactNode;
	alerts: ReactNode;
	goal?: ReactNode;
	chat?: ReactNode;
	events?: ReactNode;
	camera?: ReactNode;
}

/** Juego: piezas en las esquinas y el centro (480–1440 px) libre; la alerta pasa por arriba en el centro. */
export function GameLayout(s: SceneSlots) {
	return (
		<div className="relative h-[1080px] w-[1920px] overflow-hidden" data-scene="game">
			<div className="absolute top-10 left-12" data-piece="status">
				{s.status}
			</div>
			<div className="absolute top-10 left-[720px] w-[480px]" data-piece="alerts">
				{s.alerts}
			</div>
			{s.goal ? (
				<div className="absolute top-10 right-12" data-piece="goal">
					{s.goal}
				</div>
			) : null}
			{s.chat ? (
				<div className="absolute bottom-12 left-12" data-piece="chat">
					{s.chat}
				</div>
			) : null}
			{s.events ? (
				<div className="absolute right-12 bottom-[288px]" data-piece="events">
					{s.events}
				</div>
			) : null}
			{s.camera ? (
				<div className="absolute right-12 bottom-12" data-piece="camera">
					{s.camera}
				</div>
			) : null}
		</div>
	);
}

/** Hueco de la cámara en Just Chatting: 1216×684 en (64, 112), con el radio de `CamFrame` (16 px). */
export const CAMERA_HOLE = { x: 64, y: 112, width: 1216, height: 684, radius: 16 };

/** Máscara del fondo: opaco salvo el hueco de la cámara, que pone OBS debajo. Solo opacidad, sin color. */
function backgroundMask(): string {
	const { x, y, width: w, height: h, radius: r } = CAMERA_HOLE;
	const hole = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><path fill-rule='evenodd' d='M0 0H1920V1080H0Z${hole}'/></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Just Chatting: la cámara grande a la izquierda, el chat a la derecha y la meta y los eventos debajo de la
 * cámara, a plena opacidad. La alerta entra encima del chat sin taparlo. El fondo es una pieza más, con el hueco
 * de la cámara.
 */
export function ChattingLayout(s: SceneSlots) {
	const mask = backgroundMask();
	return (
		<div className="relative h-[1080px] w-[1920px] overflow-hidden" data-scene="chatting">
			<div
				aria-hidden="true"
				data-piece="background"
				className="pointer-events-none absolute inset-0 bg-primary"
				style={{ maskImage: mask, WebkitMaskImage: mask }}
			>
				<BackgroundPattern pattern="grid" size="lg" mask="radial" className="size-full" />
			</div>
			<div className="absolute top-10 left-16" data-piece="status">
				{s.status}
			</div>
			{s.camera ? (
				<div className="absolute top-[112px] left-16" data-piece="camera">
					{s.camera}
				</div>
			) : null}
			<div className="absolute top-[836px] left-16 flex items-start gap-12">
				{s.goal ? <div data-piece="goal">{s.goal}</div> : null}
				{s.events ? <div data-piece="events">{s.events}</div> : null}
			</div>
			<div className="absolute top-[112px] left-[1352px] w-[480px]" data-piece="alerts">
				{s.alerts}
			</div>
			{s.chat ? (
				<div className="absolute top-[280px] left-[1328px]" data-piece="chat">
					{s.chat}
				</div>
			) : null}
		</div>
	);
}
