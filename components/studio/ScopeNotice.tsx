"use client";

import { Alert, Button } from "@jotis-me/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SCOPE_DESCRIPTIONS } from "@/lib/studio/connection";

/**
 * Permisos que faltan en la sesión (specs/twitch-events, «Conexión del canal»): los pidió Scaena después de que la
 * cuenta entrase, como el de las metas. Volver a entrar con Twitch los pide y vuelve aquí.
 */
export function ScopeNotice({ missing }: { missing: string[] }) {
	const [loading, setLoading] = useState(false);
	if (missing.length === 0) return null;
	const what = missing.map((s) => (SCOPE_DESCRIPTIONS[s] ?? s).toLowerCase()).join(", ");
	return (
		<div role="alert">
			<Alert
				color="warning"
				title={missing.length === 1 ? "Falta un permiso de Twitch" : "Faltan permisos de Twitch"}
				description={`Scaena ahora pide permiso para ${what}. Hasta que vuelvas a entrar, eso no llega a los overlays. Después, pulsa «Conectar eventos».`}
				actions={
					<Button
						hierarchy="secondary"
						size="sm"
						loading={loading}
						onClick={async () => {
							setLoading(true);
							await authClient.signIn.social({
								provider: "twitch",
								callbackURL: "/studio/connection",
								errorCallbackURL: "/studio/login",
							});
						}}
					>
						Volver a entrar con Twitch
					</Button>
				}
			/>
		</div>
	);
}
