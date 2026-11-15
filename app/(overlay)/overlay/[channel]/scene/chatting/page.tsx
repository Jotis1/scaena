import { ChattingScene } from "@/components/overlay/scenes/ChattingScene";
import { sceneOptions } from "@/components/overlay/scenes/params";
import { canvasOf, SceneCanvas } from "@/lib/overlay/canvas";
import { profileForOverlay } from "@/lib/overlay/channel";
import type { SearchParams } from "@/lib/overlay/params";

// Escena montada de Just Chatting (design.md, decisión 15). Con `token`; sin él, solo chat, estado y marco.
export default async function ChattingScenePage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = await profileForOverlay((await params).channel);
	const q = await searchParams;
	// `canvas=3440x1440`: lienzo lógico de 2580×1080 escalado a 4/3 (design.md de refine-site-and-ultrawide-scenes, decisión 7).
	const canvas = canvasOf(q);
	return (
		<SceneCanvas canvas={canvas}>
			<ChattingScene profile={profile} o={sceneOptions(q)} width={canvas.width} />
		</SceneCanvas>
	);
}
