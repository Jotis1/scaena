"use client";

import { ButtonGroup } from "@jotis-me/react";
import { CANVAS_IDS, type CanvasId, canvasById, canvasLabel, DEFAULT_CANVAS } from "@/lib/overlay/canvas";
import { BUTTON_GROUP_FRAME } from "../StudioContent";

/**
 * «Tu lienzo en OBS», en `?canvas=` como en Overlays; conserva la sección (`#game`). Cambia en el momento: la URL se
 * actualiza con `history.replaceState`, sin pedir la página al servidor (specs/obs-overlays, «Cambio de lienzo
 * inmediato en la guía»).
 */
export function GuideCanvasPicker({
	canvas,
	onChange,
}: {
	canvas: CanvasId;
	onChange: (c: CanvasId) => void;
}) {
	return (
		<div className="flex shrink-0 flex-col items-start gap-1.5">
			<span aria-hidden="true" className="text-sm font-medium text-secondary">
				Tu lienzo en OBS
			</span>
			<ButtonGroup
				size="md"
				className={BUTTON_GROUP_FRAME}
				aria-label="Tu lienzo en OBS"
				value={canvas}
				onChange={(v) => {
					const next = (CANVAS_IDS as string[]).includes(v) ? (v as CanvasId) : DEFAULT_CANVAS;
					onChange(next);
					const q = next === DEFAULT_CANVAS ? "" : `?canvas=${next}`;
					window.history.replaceState(
						null,
						"",
						`${window.location.pathname}${q}${window.location.hash}`,
					);
				}}
				items={CANVAS_IDS.map((id) => ({ value: id, label: canvasLabel(canvasById(id)) }))}
			/>
		</div>
	);
}
