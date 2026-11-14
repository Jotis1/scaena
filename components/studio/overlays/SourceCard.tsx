"use client";

import { CardHeader, Input, TransparencyGrid } from "@jotis-me/react";
import { Check, Copy01 } from "@untitledui/icons";
import { type ReactNode, useState } from "react";
import { maskToken, type SourceKind, type SourceOptions, sourceUrl } from "@/lib/studio/overlay-urls";

export interface SourceCardProps {
	kind: SourceKind;
	ctx: { origin: string; channel: string; token: string };
	options: SourceOptions;
	title: string;
	/** Tamaño de la fuente en OBS, en la insignia: «420 × 520». */
	size: string;
	desc: string;
	/** La muestra, ya escalada a 360 de ancho por `previewHeight`. */
	preview: ReactNode;
	/** Alto de la caja de la vista previa: 202 (16:9) o 151 (21:9, para 3440 × 1440). */
	previewHeight?: number;
	controls: ReactNode;
}

/**
 * Una fuente de navegador (diseño: «Overlays - piezas» y «Overlays - escenas»): `CardHeader` con el nombre, el tamaño
 * y para qué sirve; la vista previa sobre `TransparencyGrid` en oscuro, como se ve en OBS; sus opciones; y la URL con
 * «Copiar» dentro del campo. El token va tapado en pantalla; al copiar va el de verdad.
 */
export function SourceCard({
	kind,
	ctx,
	options,
	title,
	size,
	desc,
	preview,
	previewHeight = 202,
	controls,
}: SourceCardProps) {
	const [now, setNow] = useState(() => Date.now());
	const [copied, setCopied] = useState(false);
	const url = sourceUrl(kind, options, { ...ctx, now });
	const copy = async () => {
		// La meta cuenta desde que se copia: `since` es ahora.
		const fresh = Date.now();
		setNow(fresh);
		await navigator.clipboard.writeText(sourceUrl(kind, options, { ...ctx, now: fresh }));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<article aria-label={title} className="overflow-hidden rounded-xl border border-secondary bg-primary">
			<CardHeader title={title} badge={size} badgeColor="gray" description={desc} />
			<div className="flex flex-wrap gap-6 px-6 pt-5 pb-6">
				<TransparencyGrid
					size="sm"
					aria-hidden="true"
					data-preview={kind}
					style={{ height: previewHeight }}
					className="dark-mode relative flex max-w-full flex-[0_0_360px] items-center justify-center overflow-hidden rounded-lg"
				>
					{preview}
				</TransparencyGrid>
				<div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
					<div className="flex flex-wrap items-end gap-x-5 gap-y-3">{controls}</div>
					<div className="mt-auto">
						<Input
							label="URL para OBS"
							size="sm"
							readOnly
							value={maskToken(url, ctx.token)}
							className="[&_input]:font-mono"
							data-url={kind}
							trailingButton={{
								label: copied ? "Copiada" : "Copiar",
								icon: copied ? Check : Copy01,
								onClick: copy,
							}}
						/>
					</div>
				</div>
			</div>
		</article>
	);
}
