"use client";

import { Badge, Button, ProgressSteps, StreamScene } from "@jotis-me/react";
import { ArrowRight, FlipBackward } from "@untitledui/icons";
import { useState } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import {
	FitScene,
	SampleChattingScene,
	SampleGameScene,
	type SampleSceneProps,
} from "@/components/scenes/SampleScenes";
import type { Profile } from "@/lib/profile";

type Step = Profile["journey"]["before"];
type SceneCopy = { badge: string; title: string; subtitle: string };

export interface StreamJourneyProps {
	login: string;
	/** Los cuatro pasos del perfil, en orden: antes, la partida, la charla, después. */
	steps: [Step, Step, Step, Step];
	/** La línea bajo «Antes» si el perfil no trae una: «Sobre las 17:00». */
	beforeHint: string;
	starting: SceneCopy;
	ending: SceneCopy;
	/** Pie de las escenas: «Normalmente, de 17:00 a 20:00». */
	footer: string;
	game: SampleSceneProps;
	chatting: SampleSceneProps;
	/** Invitación de Discord; sin ella, no sale el botón. */
	discordUrl?: string;
}

const WHERE = {
	twitch: { label: "En Twitch", network: "twitch" },
	youtube: { label: "En YouTube", network: "youtube" },
} as const;

/** Ancho de la escena en el escritorio; en móvil, el de la columna. */
const SCENE_WIDTH = 720;

/**
 * «Cómo va un directo» (diseño: «Portada»; specs/channel-site, «Portada del canal»): cuatro pasos pulsables con
 * `ProgressSteps`, cada uno con su escena real y dónde pasa. Las escenas son muestra: ocultas y sin foco. Solo se
 * monta la del paso elegido.
 */
export function StreamJourney(p: StreamJourneyProps) {
	const [step, setStep] = useState(0);
	const last = step === p.steps.length - 1;
	const twitch = `twitch.tv/${p.login}`;

	const scene = (i: number) => {
		if (i === 0)
			return (
				<div aria-hidden="true" inert>
					<StreamScene
						variant="starting"
						{...p.starting}
						seconds={300}
						paused
						channel={p.login}
						handle={twitch}
					/>
				</div>
			);
		if (i === 1)
			return (
				<FitScene initialWidth={SCENE_WIDTH}>
					<SampleGameScene {...p.game} />
				</FitScene>
			);
		if (i === 2)
			return (
				<FitScene initialWidth={SCENE_WIDTH}>
					<SampleChattingScene {...p.chatting} />
				</FitScene>
			);
		return (
			<div aria-hidden="true" inert>
				<StreamScene
					variant="ending"
					{...p.ending}
					next={p.footer}
					channel={p.login}
					handle={twitch}
				/>
			</div>
		);
	};

	const actions = (i: number) => {
		if (i === 0)
			return (
				<Button
					hierarchy="secondary"
					size="md"
					href={`https://${twitch}`}
					iconLeading={<SocialLogo network="twitch" width={18} height={20} />}
				>
					Seguir en Twitch
				</Button>
			);
		if (i === 3)
			return (
				<div className="flex flex-wrap gap-3">
					<Button hierarchy="secondary" size="md" href="/videos">
						Ver los vídeos
					</Button>
					{p.discordUrl ? (
						<Button
							hierarchy="tertiary"
							size="md"
							href={p.discordUrl}
							iconLeading={<SocialLogo network="discord" width={18} height={18} />}
						>
							Entrar en Discord
						</Button>
					) : null}
				</div>
			);
		return null;
	};

	return (
		<section aria-labelledby="como-va" className="border-b border-secondary bg-secondary">
			<div className="mx-auto flex max-w-320 flex-col gap-10 px-4 py-14 md:px-8 md:py-22">
				<div className="flex max-w-160 flex-col gap-2">
					<h2
						id="como-va"
						className="font-display text-display-xs font-semibold text-primary md:text-display-sm"
					>
						Cómo va un directo
					</h2>
					<p className="text-md text-tertiary">
						Cuatro momentos, de la cuenta atrás al vídeo en YouTube. Pulsa cada uno para verlo.
					</p>
				</div>

				<ProgressSteps
					// `ProgressSteps` da a cada botón el título como nombre y la línea de apoyo como descripción.
					steps={p.steps.map((s, i) => ({
						title: s.title,
						description: s.hint ?? (i === 0 ? p.beforeHint : undefined),
					}))}
					current={step}
					type="text-line"
					size="md"
					onChange={setStep}
					aria-label="Cómo va un directo"
					className="flex flex-col gap-10"
				>
					{(i) => {
						const s = p.steps[i];
						const where = WHERE[s.where];
						return (
							<div className="flex flex-wrap items-center gap-x-14 gap-y-8">
								<div className="w-180 max-w-full flex-none overflow-hidden rounded-xl border border-secondary shadow-lg">
									{scene(i)}
								</div>
								<div className="flex min-w-0 flex-[1_1_320px] flex-col items-start gap-4">
									<Badge
										color="gray"
										type="pill"
										size="md"
										icon={<SocialLogo network={where.network} width={12} height={12} />}
									>
										{where.label}
									</Badge>
									<h3 className="font-display text-display-xs font-semibold text-primary">
										{s.heading}
									</h3>
									<p className="text-md text-tertiary">{s.text}</p>
									{actions(i)}
									<Button
										hierarchy="link-color"
										size="md"
										iconTrailing={last ? FlipBackward : ArrowRight}
										onClick={() => setStep(last ? 0 : step + 1)}
										className="mt-2"
									>
										{last
											? "Volver al principio"
											: `Siguiente: ${p.steps[step + 1].title.toLowerCase()}`}
									</Button>
								</div>
							</div>
						);
					}}
				</ProgressSteps>
			</div>
		</section>
	);
}
