import { BackgroundPattern, Icon } from "@jotis-me/react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import type { Profile } from "@/lib/profile";

/** «Quién juega y cómo»: lema, enlace a Twitch, descripción y «Ajustes de partida» (diseño: portada). */
export function WhoPlays({ profile }: { profile: Profile }) {
	const twitch = `twitch.tv/${profile.twitch.login}`;
	return (
		<section aria-labelledby="who" className="relative overflow-hidden border-b border-secondary">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<BackgroundPattern pattern="grid" size="lg" mask="radial-down" className="size-full" />
			</div>
			<div className="relative mx-auto flex max-w-320 flex-wrap items-start gap-x-16 gap-y-10 px-4 pt-14 pb-12 md:px-8 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
				<div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
					<h1
						id="who"
						className="max-w-[12ch] font-display text-display-md font-semibold tracking-tight text-primary md:text-display-lg xl:text-display-2xl"
					>
						{profile.tagline}
					</h1>
					<a
						href={`https://${twitch}`}
						className="-mt-1 inline-flex items-center gap-2 self-start rounded-sm text-md font-semibold text-brand-secondary hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none"
					>
						<SocialLogo network="twitch" width={14} height={16} />
						{twitch}
					</a>
					<div className="flex max-w-150 flex-col gap-3">
						{profile.description.map((p) => (
							<p key={p} className="text-lg text-secondary">
								{p}
							</p>
						))}
					</div>
				</div>
				<PlaySettings items={profile.playSettings} />
			</div>
		</section>
	);
}

/** Lista fija, sin controles: nada aquí recibe el foco (specs/channel-site, «Ajustes de partida sin controles»). */
function PlaySettings({ items }: { items: Profile["playSettings"] }) {
	return (
		<section
			aria-labelledby="play-settings"
			className="flex min-w-0 max-w-110 flex-[1_1_340px] flex-col gap-1 rounded-xl border border-secondary bg-primary p-6 shadow-sm"
		>
			<div className="flex items-center gap-2.5 pb-3">
				<Icon name="sliders-01" size={20} className="text-fg-tertiary" />
				<div className="flex flex-col">
					<h2 id="play-settings" className="text-md font-semibold text-primary">
						Ajustes de partida
					</h2>
					<span className="text-sm text-tertiary">Así se juega aquí.</span>
				</div>
			</div>
			<ul className="flex flex-col">
				{items.map((s, i) => (
					<li
						key={s.title}
						className={`flex items-start gap-3 border-t border-secondary ${i === items.length - 1 ? "pt-3.5" : "py-3.5"}`}
					>
						<Icon name="check" size={20} className="text-fg-tertiary" />
						<span className="flex flex-col">
							<span className="text-sm font-medium text-secondary">{s.title}</span>
							<span className="text-sm text-tertiary">{s.text}</span>
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
