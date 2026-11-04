import { CamFrame } from "@jotis-me/react";
import { profileForOverlay } from "@/lib/overlay/channel";
import { bool, int, oneOf, type SearchParams, text } from "@/lib/overlay/params";

// Marco de cámara (specs/obs-overlays): el interior queda transparente y la cámara la pone OBS debajo.
const RATIOS = ["16:9", "4:3", "1:1"] as const;

export default async function CameraOverlay({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const profile = profileForOverlay((await params).channel);
	const q = await searchParams;
	const role = text(q, "role", "", 40);

	return (
		<CamFrame
			ratio={oneOf(q, "ratio", RATIOS, "16:9")}
			width={int(q, "width", 480, { min: 160, max: 1920 })}
			live={bool(q, "live", true)}
			name={text(q, "name", profile.camera.name, 40)}
			role={role || undefined}
		/>
	);
}
