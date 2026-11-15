"use client";

import { ButtonGroup } from "@jotis-me/react";
import { usePathname, useRouter } from "next/navigation";
import { CANVAS_IDS, type CanvasId, canvasById, canvasLabel, DEFAULT_CANVAS } from "@/lib/overlay/canvas";

/** «Tu lienzo en OBS» (diseño: «Guía de OBS»), en `?canvas=` como en Overlays; conserva la sección (`#game`). */
export function GuideCanvasPicker({ canvas }: { canvas: CanvasId }) {
	const router = useRouter();
	const path = usePathname();
	return (
		<div className="flex flex-col gap-1.5">
			<span aria-hidden="true" className="text-sm font-medium text-secondary">
				Tu lienzo en OBS
			</span>
			<ButtonGroup
				size="md"
				aria-label="Tu lienzo en OBS"
				value={canvas}
				onChange={(v) => {
					const q = v === DEFAULT_CANVAS ? "" : `?canvas=${v}`;
					router.replace(`${path}${q}${window.location.hash}`, { scroll: false });
				}}
				items={CANVAS_IDS.map((id) => ({ value: id, label: canvasLabel(canvasById(id)) }))}
			/>
		</div>
	);
}
