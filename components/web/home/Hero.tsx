"use client";

import { BackgroundPattern, BrowserFrame, Button, StreamScene, StreamStatus } from "@jotis-me/react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { useSiteStatus } from "@/components/live/LiveStatusProvider";
import { useNow } from "@/components/live/useLiveStatus";
import { FitScene, SampleGameScene, type SampleSceneProps } from "@/components/scenes/SampleScenes";
import { uptime } from "@/lib/uptime";

export interface HeroProps {
	login: string;
	tagline: string;
	intro: string;
	/** «Suele haber directo de 17:00 a 20:00.» */
	usually: string;
	/** La escena offline, con los textos del perfil. */
	offline: { badge: string; title: string; subtitle: string; next: string };
	scene: SampleSceneProps;
}

/**
 * Primera sección de la portada (diseño: «Portada» y «Portada en directo»; specs/channel-site, «Portada del canal»):
 * el estado del directo, el lema, qué es la web, los botones y un marco con lo que se vería ahora en Twitch. Sigue al
 * estado del layout, así que cambia sola al empezar o acabar el directo. `#schedule` es el destino de `/live` sin
 * directo: aquí se lee la franja habitual.
 */
export function Hero(p: HeroProps) {
	const status = useSiteStatus();
	const live = status?.live ? status : null;
	const now = useNow(Boolean(live));
	const twitch = `twitch.tv/${p.login}`;
	return (
		<section
			id="schedule"
			aria-labelledby="que-es"
			className="relative scroll-mt-6 overflow-hidden border-b border-secondary"
		>
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<BackgroundPattern pattern="grid" size="lg" mask="radial-down" className="size-full" />
			</div>
			<div className="relative mx-auto flex max-w-320 flex-wrap items-center gap-x-16 gap-y-12 px-4 pt-12 pb-12 md:px-8 md:pt-20 md:pb-20 xl:pt-24 xl:pb-22">
				<div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						{live ? (
							<StreamStatus
								status="live"
								uptime={uptime(live.startedAt, now)}
								category={live.category || undefined}
							/>
						) : (
							<>
								<StreamStatus status="offline" />
								<span className="text-sm text-tertiary">{p.usually}</span>
							</>
						)}
					</div>
					<h1
						id="que-es"
						className="max-w-[13ch] font-display text-display-md font-semibold tracking-tight text-primary md:text-display-lg xl:text-display-xl"
					>
						{p.tagline}
					</h1>
					<p className="max-w-140 text-lg text-tertiary">{p.intro}</p>
					<div className="flex flex-wrap gap-3">
						<Button
							hierarchy="primary"
							size="lg"
							href={`https://${twitch}`}
							iconLeading={<SocialLogo network="twitch" width={18} height={20} />}
						>
							{live ? "Entrar al directo" : "Ver en Twitch"}
						</Button>
						<Button hierarchy="secondary" size="lg" href="/videos">
							Ver los vídeos
						</Button>
					</div>
				</div>
				{/* El marco ocupa su media columna, hasta 640 px, pegado a la derecha en escritorio (design.md, decisión 5). */}
				<div className="flex min-w-0 flex-[1_1_480px] justify-center lg:justify-end">
					<BrowserFrame variant="minimal" url={twitch} className="w-full max-w-160">
						{live ? (
							<FitScene initialWidth={598}>
								<SampleGameScene {...p.scene} />
							</FitScene>
						) : (
							<div aria-hidden="true" inert>
								<StreamScene
									variant="offline"
									badge={p.offline.badge}
									title={p.offline.title}
									subtitle={p.offline.subtitle}
									next={p.offline.next}
									channel={p.login}
									handle={twitch}
								/>
							</div>
						)}
					</BrowserFrame>
				</div>
			</div>
		</section>
	);
}
