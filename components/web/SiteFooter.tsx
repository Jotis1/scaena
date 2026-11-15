import { Footer } from "@jotis-me/react";
import { loadMainProfile } from "@/lib/profile";
import { linkedSocials, SOCIAL_NAMES } from "@/lib/profile/socials";
import { ScaenaBrand } from "./ScaenaBrand";

/** «Esta web»: lo mismo que la cabecera; «Estudio», a Overlays con sesión y a la entrada sin ella. */
export function siteLinks(signedIn: boolean) {
	return [
		{ label: "Inicio", href: "/" },
		{ label: "Vídeos", href: "/videos" },
		{ label: "Estudio", href: signedIn ? "/studio/overlays" : "/studio/login" },
	];
}

/**
 * Pie de la web con el `Footer` de Regula (diseño: «Portada» y «Vídeos»): la marca, la línea del perfil, «El canal»
 * y «Esta web», con las mismas páginas que la cabecera (specs/channel-site, «Diseño de la suite»). Las redes sin enlace (Discord sin invitación) no salen (specs/channel-profile, «Enlaces opcionales»).
 */
export async function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
	const profile = await loadMainProfile();
	return (
		<Footer
			type="large-02"
			brand={<ScaenaBrand size={24} />}
			description={profile.site.footer}
			columns={[
				{
					title: "El canal",
					links: linkedSocials(profile).map((s) => ({
						label: SOCIAL_NAMES[s.network],
						href: s.url,
					})),
				},
				{
					title: "Esta web",
					links: siteLinks(signedIn),
				},
			]}
			copyright="Scaena es parte de jotis.me."
		/>
	);
}
