import { ChattingScene } from "@/components/overlay/scenes/ChattingScene";
import { sceneOptions } from "@/components/overlay/scenes/params";
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
	const profile = profileForOverlay((await params).channel);
	return <ChattingScene profile={profile} o={sceneOptions(await searchParams)} />;
}
