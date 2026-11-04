// Título, descripción e imagen para redes de cada página (specs/channel-site, «Metadatos para compartir»). La
// imagen es el banner del perfil exportado desde el estudio (`public/banner.png`, 1200×480): si cambia el perfil,
// se vuelve a exportar en /studio/assets y se sustituye.
import type { Metadata } from "next";
import { getMainProfile } from "./profile";

const SITE = "Scaena";

export function siteUrl(): URL {
	return new URL(process.env.BETTER_AUTH_URL || "https://scaena.jotis.me");
}

export function pageMetadata(p: { title?: string; description?: string; path: string }): Metadata {
	const profile = getMainProfile();
	const title = p.title ? `${p.title} · ${SITE}` : `${SITE} · ${profile.name}`;
	const description = p.description ?? profile.tagline;
	const image = {
		url: "/banner.png",
		width: 1200,
		height: 480,
		alt: `${profile.twitch.login}: ${profile.tagline}`,
	};
	return {
		metadataBase: siteUrl(),
		title,
		description,
		alternates: { canonical: p.path },
		openGraph: {
			type: "website",
			locale: "es_ES",
			siteName: SITE,
			url: p.path,
			title,
			description,
			images: [image],
		},
		twitter: { card: "summary_large_image", title, description, images: [image.url] },
	};
}
