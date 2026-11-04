// Paneles y banner del perfil de Twitch a partir del perfil del canal (specs/twitch-profile-assets; design.md,
// decisión 11). Cada texto sale de un solo sitio del perfil: un panel con `from` toma los párrafos de la
// descripción o las normas; uno con `rows`, las filas del horario o de las redes.
import type { Profile } from "../profile";
import { bannerRows, panelRows } from "../profile/schedule";
import { linkedSocials, SOCIAL_NAMES, socialHandle } from "../profile/socials";

export interface PanelData {
	slug: string;
	title: string;
	icon: string;
	paragraphs: string[];
	rows?: { label: string; value: string }[];
	action?: { label: string; href: string };
	/** Nombre del PNG: `panel-<slug>.png`. */
	file: string;
	/** Por qué no lleva enlace, si no lo lleva (diseño: «Recursos»). */
	noLinkReason?: string;
}

export interface BannerData {
	name: string;
	tagline: string;
	eyebrow: string;
	schedule: { day: string; time: string }[];
	file: "banner.png";
}

function paragraphsOf(p: Profile, panel: Profile["panels"][number]): string[] {
	if (panel.from === "description") return p.description;
	if (panel.from === "rules") return p.rules.map((r, i) => `${i + 1}. ${r}`);
	return panel.paragraphs ?? [];
}

export function panelsOf(p: Profile): PanelData[] {
	return p.panels.map((panel) => {
		// La red de Twitch no se repite en un panel que ya está en Twitch.
		const socials = linkedSocials(p).filter((s) => s.network !== "twitch");
		const rows =
			panel.rows === "schedule"
				? panelRows(p.schedule)
				: panel.rows === "socials"
					? socials.map((s) => ({ label: SOCIAL_NAMES[s.network], value: socialHandle(p, s) }))
					: undefined;
		const action = panel.action ? { label: panel.action.text, href: panel.action.url } : undefined;
		return {
			slug: panel.slug,
			title: panel.title,
			icon: panel.icon,
			paragraphs: paragraphsOf(p, panel),
			rows,
			action,
			file: `panel-${panel.slug}.png`,
			noLinkReason: action
				? undefined
				: panel.rows === "socials" && socials.length > 1
					? `Sin enlace: Twitch solo admite uno por panel y aquí hay ${socials.length === 2 ? "dos" : socials.length} redes.`
					: "Sin enlace: este panel solo se lee.",
		};
	});
}

export function bannerOf(p: Profile): BannerData {
	return {
		name: p.twitch.login,
		tagline: p.tagline,
		eyebrow: p.banner.eyebrow,
		schedule: bannerRows(p.schedule),
		file: "banner.png",
	};
}
