"use client";

import { Alert, Button } from "@jotis-me/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SCOPE_DESCRIPTIONS } from "@/lib/studio/connection";

/**
 * Permisos que le faltan al token de la sesión, según Twitch (specs/twitch-events, «Conexión del canal»). Volver a
 * entrar con Twitch los pide y vuelve aquí. El texto dice cómo están las cosas, no qué ha cambiado.
 */
export function ScopeNotice({ missing }: { missing: string[] }) {
	const [loading, setLoading] = useState(false);
	if (missing.length === 0) return null;
	// Solo la primera letra en minúscula: «ver tus metas de Twitch», no «de twitch».
	const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
	const what = missing.map((s) => lower(SCOPE_DESCRIPTIONS[s] ?? s)).join(", ");
	return (
		<div role="alert">
			<Alert
				color="warning"
				title={missing.length === 1 ? "Falta un permiso de Twitch" : "Faltan permisos de Twitch"}
				description={`Para ${what} hace falta un permiso que tu sesión no tiene. Vuelve a entrar con Twitch y después pulsa «Conectar eventos».`}
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
