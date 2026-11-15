import { AppIcon } from "@jotis-me/react";
import { SocialLogo } from "./SocialLogo";

// Delante de cada meta en el estudio: de dónde sale, sin texto de prefijo (specs/obs-overlays, «Qué meta sale»).
// La de Scaena, con el icono sólido de la app (el del favicon, el que vale por debajo de 32 px); la de Twitch, con
// su logo en monocromo, como el resto de logos (`SocialLogo`, «neutro primero»). Los dos son decorativos: el nombre
// lo pone la etiqueta.

/** Icono de Scaena, el del favicon (`app/favicon.svg`). */
export function ScaenaMark({ size = 20 }: { size?: number }) {
	return (
		<span aria-hidden="true" className="inline-flex shrink-0" data-source="scaena">
			<AppIcon app="scaena" variant="solid" size={size} label="" />
		</span>
	);
}

/** Logo de Twitch, del color del texto. */
export function TwitchMark({ size = 20 }: { size?: number }) {
	return (
		<span
			aria-hidden="true"
			className="inline-flex shrink-0 items-center justify-center text-secondary"
			style={{ width: size, height: size }}
			data-source="twitch"
		>
			<SocialLogo network="twitch" width={Math.round(size * 0.8)} height={Math.round(size * 0.9)} />
		</span>
	);
}

export const GoalSourceIcon = ({ source, size }: { source: "scaena" | "twitch"; size?: number }) =>
	source === "twitch" ? <TwitchMark size={size} /> : <ScaenaMark size={size} />;
