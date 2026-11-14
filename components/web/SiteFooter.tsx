import { Footer } from "@jotis-me/react";
import { getMainProfile } from "@/lib/profile";
import { linkedSocials, SOCIAL_NAMES } from "@/lib/profile/socials";
import { ScaenaBrand } from "./ScaenaBrand";

/**
 * Pie de la web con el `Footer` de Regula (diseño: «Portada» y «Vídeos»): la marca, la línea del perfil, «El canal»
 * y «Esta web». Las redes sin enlace (Discord sin invitación) no salen (specs/channel-profile, «Enlaces opcionales»).
 */
export function SiteFooter() {
	const profile = getMainProfile();
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
					links: [
						{ label: "Inicio", href: "/" },
						{ label: "Vídeos", href: "/videos" },
					],
				},
			]}
			copyright="Scaena es parte de jotis.me."
		/>
	);
}
