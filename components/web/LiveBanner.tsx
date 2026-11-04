"use client";

import { Banner, Button } from "@jotis-me/react";
import { useEffect, useState } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { useSiteStatus } from "@/components/live/LiveStatusProvider";
import { useNow } from "@/components/live/useLiveStatus";
import { formatNumber } from "@/lib/format";
import { uptime } from "@/lib/uptime";

const CLOSED_KEY = "scaena:live-banner-closed";

/**
 * Aviso de directo (diseño: «Portada en directo»; specs/channel-site, «Aviso de directo»). `Banner` de marca a
 * todo el ancho, con «En directo» en índigo y sin rojo. Aparece y se va solo, con el sondeo del layout. Cerrado,
 * no vuelve en esa visita mientras dure el mismo directo.
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
	const details = [
		live.category,
		`${uptime(live.startedAt, now)} en emisión`,
		`${formatNumber(live.viewers)} espectadores`,
	];
	return (
		<Banner
			layout="full"
			theme="brand"
			icon="play"
			aria-label="En directo ahora"
			title={`En directo: ${live.title}`}
			description={details.filter(Boolean).join(" - ")}
			onClose={close}
			closeLabel="Cerrar el aviso"
			actions={
				<div className="flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:gap-4">
					<a
						href="/live"
						className="order-2 rounded-sm font-mono text-[13px] leading-5 text-tertiary_on-brand hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none sm:order-1"
					>
						scaena.jotis.me/live
					</a>
					<Button
						hierarchy="secondary"
						size="sm"
						href={twitch}
						className="order-1 w-full sm:order-2 sm:w-auto"
						iconLeading={<SocialLogo network="twitch" width={14} height={16} />}
					>
						Ver en Twitch
					</Button>
				</div>
			}
		/>
	);
}
