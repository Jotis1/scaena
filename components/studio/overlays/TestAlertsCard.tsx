"use client";

import { Button, CardHeader } from "@jotis-me/react";
import { RefreshCw01, Star01, Stars02, UserPlus01, Users01, Zap } from "@untitledui/icons";
import { useState } from "react";
import { TEST_ALERTS } from "@/lib/studio/test-alerts";
import type { AlertType } from "@/lib/twitch/eventsub/event";

/** Icono de cada botón de «Alertas de prueba». */
const TEST_ICONS: Record<AlertType, typeof Zap> = {
	follow: UserPlus01,
	sub: Star01,
	resub: RefreshCw01,
	gift: Stars02,
	raid: Users01,
	bits: Zap,
};

/**
 * «Alertas de prueba» (diseño: «Overlays»; specs/twitch-events, «Disparo de prueba»): seis botones que mandan un
 * evento a la fuente de alertas como si fuera de verdad. El chat no se entera.
 */
export function TestAlertsCard() {
	const [sent, setSent] = useState<string>();
	const [error, setError] = useState<string>();
	const send = async (type: string, label: string) => {
		setError(undefined);
		const res = await fetch("/api/studio/test", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ type }),
		}).catch(() => null);
		if (res?.ok) setSent(label);
		else setError("No ha salido. Comprueba la conexión y vuelve a probar.");
	};
	return (
		<section
			aria-label="Alertas de prueba"
			className="overflow-hidden rounded-xl border border-secondary bg-primary"
		>
			<CardHeader
				title="Alertas de prueba"
				description="Salen en la fuente de alertas, con la frase de su tipo. En el chat no aparecen."
			/>
			<div className="flex flex-col gap-3 px-6 pt-5 pb-6">
				<div className="flex flex-wrap gap-2">
					{TEST_ALERTS.map((t) => (
						<Button
							key={t.type}
							hierarchy="secondary"
							size="sm"
							iconLeading={TEST_ICONS[t.type]}
							onClick={() => send(t.type, t.label)}
						>
							{t.label}
						</Button>
					))}
				</div>
				<p aria-live="polite" className="text-sm text-tertiary empty:hidden">
					{error ?? (sent ? `Enviada: ${sent}.` : "")}
				</p>
			</div>
		</section>
	);
}
