import { StreamScene } from "@jotis-me/react";
import { notFound } from "next/navigation";
import { profileForOverlay } from "@/lib/overlay/channel";
import { date, optionalInt, type SearchParams, text } from "@/lib/overlay/params";
import { sceneFooter } from "@/lib/profile/schedule";

// Escenas de 1920×1080 (specs/obs-overlays, «Lienzo de emisión» y «Textos de las escenas»). Las montadas
// (`game` y `chatting`) llevan piezas en vivo y van en su propia ruta (tarea 7.4).
const VARIANTS = ["starting", "brb", "ending", "offline"] as const;
type Variant = (typeof VARIANTS)[number];

const WITH_COUNTDOWN: readonly Variant[] = ["starting", "brb"];
const WITH_FOOTER: readonly Variant[] = ["ending", "offline"];

export default async function SceneOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string; variant: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const { channel, variant } = await params;
	if (!(VARIANTS as readonly string[]).includes(variant)) notFound();
	const v = variant as Variant;
	const profile = profileForOverlay(channel);
	const q = await searchParams;
	const copy = profile.scenes[v];

	// Cuenta atrás: `target` (fecha) manda sobre `minutes`; solo en «empezando» y «vuelvo enseguida».
	const hasCountdown = WITH_COUNTDOWN.includes(v);
	const target = hasCountdown ? date(q, "target") : undefined;
	const minutes = hasCountdown && !target ? optionalInt(q, "minutes", { min: 1, max: 180 }) : undefined;

	return (
		<StreamScene
			variant={v}
			badge={copy.badge}
			title={copy.title}
			subtitle={copy.subtitle}
			target={target?.toISOString()}
			seconds={minutes === undefined ? undefined : minutes * 60}
			channel={profile.twitch.login}
			handle={`twitch.tv/${profile.twitch.login}`}
			next={WITH_FOOTER.includes(v) ? text(q, "next", sceneFooter(profile.schedule)) : undefined}
			scale={1}
		/>
	);
}
