import { AppIcon } from "@jotis-me/react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { getMainProfile } from "@/lib/profile";
import { linkedSocials, SOCIAL_NAMES } from "@/lib/profile/socials";

/** Pie de la web. Las redes sin enlace (Discord sin invitación) no salen (specs/channel-profile). */
export function SiteFooter() {
	const profile = getMainProfile();
	return (
		<footer className="border-t border-secondary">
			<div className="mx-auto flex max-w-320 flex-wrap items-center gap-4 px-4 py-6 md:px-8">
				<div className="flex flex-auto items-center gap-2">
					<AppIcon letters="Sc" hue="lime" size={20} label="Scaena" />
					<span className="text-sm text-tertiary">
						Scaena, el canal de {profile.name}. Parte de{" "}
						<a
							href="https://jotis.me"
							className="rounded-sm text-tertiary underline-offset-2 hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none"
						>
							jotis.me
						</a>
						.
					</span>
				</div>
				<nav aria-label="Redes" className="flex gap-1">
					{linkedSocials(profile).map((s) => (
						<a
							key={s.network}
							href={s.url}
							aria-label={SOCIAL_NAMES[s.network]}
							className="flex size-10 items-center justify-center rounded-lg text-fg-tertiary transition-colors duration-100 hover:bg-primary_hover focus-visible:shadow-focus-ring focus-visible:outline-none"
						>
							<SocialLogo network={s.network} width={20} height={20} />
						</a>
					))}
				</nav>
			</div>
		</footer>
	);
}
