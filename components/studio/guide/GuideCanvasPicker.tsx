"use client";

import { Select } from "@jotis-me/react";
import { usePathname, useRouter } from "next/navigation";
import { CANVAS_IDS, type CanvasId, canvasById, canvasLabel, DEFAULT_CANVAS } from "@/lib/overlay/canvas";

/** Lienzo de la guía, en `?canvas=` como en Overlays; conserva la sección (`#game`) al cambiarlo. */
export function GuideCanvasPicker({ canvas }: { canvas: CanvasId }) {
	const router = useRouter();
	const path = usePathname();
	return (
		<div className="w-60 max-w-full">
			<Select
				label="Lienzo"
				size="sm"
				value={canvas}
				onChange={(v) => {
					const q = v === DEFAULT_CANVAS ? "" : `?canvas=${v}`;
					router.replace(`${path}${q}${window.location.hash}`, { scroll: false });
				}}
				options={CANVAS_IDS.map((id) => ({ value: id, label: canvasLabel(canvasById(id)) }))}
			/>
		</div>
	);
}
