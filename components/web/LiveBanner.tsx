"use client";

import { Banner, Button } from "@jotis-me/react";
import { Play } from "@untitledui/icons";
import { useEffect, useState } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { useSiteStatus } from "@/components/live/LiveStatusProvider";
import { useNow } from "@/components/live/useLiveStatus";
import { uptime } from "@/lib/uptime";

const CLOSED_KEY = "scaena:live-banner-closed";

/**
 * Aviso de directo (diseño: «Portada en directo»; specs/channel-site, «Aviso de directo»). `Banner` de marca a
 * todo el ancho, con «En directo» en índigo y sin rojo, la categoría y el tiempo en emisión, y «Ver en Twitch».
 * Aparece y se va solo, con el sondeo del layout. Cerrado, no vuelve en esa visita mientras dure el mismo directo.
 */
export function LiveBanner({ login }: { login: string }) {
	const status = useSiteStatus();
	const live = status?.live ? status : null;
	const now = useNow(Boolean(live));
	const [closed, setClosed] = useState<string | null>(null);

	useEffect(() => {
		try {
			setClosed(sessionStorage.getItem(CLOSED_KEY));
		} catch {}
	}, []);

	if (!live || closed === live.startedAt) return null;
	const close = () => {
		setClosed(live.startedAt);
		try {
			sessionStorage.setItem(CLOSED_KEY, live.startedAt);
		} catch {}
	};
	const twitch = `https://twitch.tv/${login}`;
	return (
		<Banner
			layout="full"
			theme="brand"
			icon={Play}
			aria-label="En directo ahora"
			title={`En directo: ${live.title}`}
			description={[live.category, `${uptime(live.startedAt, now)} en emisión`]
				.filter(Boolean)
				.join(", ")}
			onClose={close}
			closeLabel="Cerrar el aviso"
			actions={
				<Button
					hierarchy="secondary"
					size="sm"
					href={twitch}
					iconLeading={<SocialLogo network="twitch" width={14} height={16} />}
				>
					Ver en Twitch
				</Button>
			}
		/>
	);
}
