import { Badge, Tag } from "@jotis-me/react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import type { Profile } from "@/lib/profile";
import { slotText } from "@/lib/profile/schedule";
import { linkedSocials, SOCIAL_NAMES, socialHandle } from "@/lib/profile/socials";
import { LiveBadge } from "./LiveBadge";

/** «Cuándo suelo estar» (ancla `#schedule`, a la que lleva `/live` sin directo) y «Dónde verlo». */
export function WhenAndWhere({ profile }: { profile: Profile }) {
	return (
		<section aria-label="Cuándo y dónde" className="border-b border-secondary bg-secondary">
			<div className="mx-auto grid max-w-320 grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-16 gap-y-12 px-4 py-14 md:px-8 md:py-20">
				<div id="schedule" className="flex scroll-mt-6 flex-col gap-6">
					<Heading title="Cuándo suelo estar" subtitle="La franja habitual de directo." />
					<div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-tertiary">Normalmente</span>
							<span className="font-body text-display-md font-semibold tracking-tight text-primary tabular-nums lg:text-display-lg">
								{slotText(profile.schedule)}
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge color="gray" type="pill" size="md" icon="info-circle">
								Lo habitual, no una cita
							</Badge>
						</div>
						<p className="text-md text-secondary">
							Hay días sin directo y días en los que la partida se alarga. Para no perderte el
							aviso, sigue el canal en Twitch.
						</p>
						<div className="flex flex-wrap items-center gap-2 border-t border-secondary pt-4">
							<span className="mr-1 text-sm text-tertiary">Qué se emite</span>
							{profile.streams.map((s) => (
								<Tag key={s} size="md">
									{s}
								</Tag>
							))}
							<span className="ml-auto text-xs text-quaternary">{profile.schedule.zone}</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap items-end justify-between gap-3">
						<Heading
							title="Dónde verlo"
							subtitle="El directo en Twitch, los vídeos en YouTube y la charla en Discord."
						/>
						<LiveBadge />
					</div>
					<div className="flex flex-col gap-3">
						{linkedSocials(profile).map((s) => (
							<a
								key={s.network}
								href={s.url}
								className="flex min-h-11 items-center gap-4 rounded-xl border border-secondary bg-primary p-4 transition-colors duration-100 hover:bg-primary_hover focus-visible:shadow-focus-ring focus-visible:outline-none"
							>
								<span className="flex size-11 flex-none items-center justify-center rounded-lg border border-secondary bg-secondary text-fg-tertiary">
									<SocialLogo network={s.network} width={22} height={20} />
								</span>
								<span className="flex min-w-0 flex-auto flex-col">
									<span className="text-md font-semibold text-primary">
										{SOCIAL_NAMES[s.network]}
									</span>
									<span className="text-sm text-tertiary">{s.text}</span>
								</span>
								<span className="hidden flex-none font-mono text-[13px] leading-5 text-tertiary sm:inline">
									{socialHandle(profile, s)}
								</span>
							</a>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="flex flex-col gap-1">
			<h2 className="font-display text-display-xs font-semibold text-primary md:text-display-sm">
				{title}
			</h2>
			<p className="text-md text-tertiary">{subtitle}</p>
		</div>
	);
}
