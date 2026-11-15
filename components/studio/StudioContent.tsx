import type { ReactNode } from "react";

/**
 * El contenido de una página del estudio: 1280 px como mucho, centrado, con el relleno del diseño
 * (`min(32px, 4.2%)` a los lados). Va después de la franja del aviso de eventos, que es a todo el ancho.
 */
export function StudioContent({
	children,
	gap = "gap-8",
}: {
	children: ReactNode;
	gap?: "gap-8" | "gap-10";
}) {
	return (
		<div
			className={`mx-auto flex w-full max-w-320 min-w-0 flex-col ${gap} px-[min(32px,4.2%)] pt-8 pb-16`}
		>
			{children}
		</div>
	);
}

/** Cabecera de página del diseño: título en Bricolage y una frase debajo; a la derecha, lo que la página ponga. */
export function StudioPageHeader({
	title,
	description,
	aside,
}: {
	title: string;
	description: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
			<div className="flex min-w-0 flex-[1_1_420px] flex-col gap-1">
				<h1 className="font-display text-display-xs font-semibold text-primary">{title}</h1>
				<p className="max-w-180 text-md text-tertiary">{description}</p>
			</div>
			{aside}
		</div>
	);
}
