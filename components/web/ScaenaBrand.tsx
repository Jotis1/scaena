import { AppIcon } from "@jotis-me/react";

/**
 * Marca de Scaena (diseño: cabecera, pie y estudio): el icono de app y «Scaena» en Bricolage bold `text-primary`,
 * el estilo que la guía da a «jotis.me». El icono va en la variante clara en claro y en la normal en oscuro; las dos
 * están en el HTML y la clase `dark-mode` elige, así no hay destello al hidratar.
 */
export function ScaenaBrand({ size, label = "Scaena" }: { size: 24 | 32; label?: string }) {
	return (
		<span className="flex items-center gap-2.5">
			<span className="contents dark:hidden">
				<AppIcon app="scaena" variant="light" size={size} label={label} />
			</span>
			<span className="hidden dark:contents">
				<AppIcon app="scaena" variant="default" size={size} label={label} />
			</span>
			<span
				className={`font-display font-bold tracking-tight text-primary ${size === 32 ? "text-xl" : "text-lg"}`}
			>
				Scaena
			</span>
		</span>
	);
}
