"use client";

import { Button, Input, Modal } from "@jotis-me/react";
import { RefreshCw01 } from "@untitledui/icons";
import { useState } from "react";

/**
 * «Token de los overlays», en la cabecera de Overlays (diseño: «Overlays» y «Overlays - rotar token»; specs/obs-overlays,
 * «Rotar el token»): el token tapado salvo los cuatro últimos caracteres y «Rotar» dentro del campo, que pide
 * confirmación con un `Modal` destructivo.
 */
export function TokenField({ token, onRotated }: { token: string; onRotated: (t: string) => void }) {
	const [confirming, setConfirming] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const rotate = async () => {
		setBusy(true);
		setError(undefined);
		try {
			const res = await fetch("/api/studio/token", { method: "POST" });
			if (!res.ok) throw new Error(String(res.status));
			onRotated(((await res.json()) as { token: string }).token);
			setConfirming(false);
		} catch {
			setError("No se ha podido rotar. El token de antes sigue valiendo; vuelve a intentarlo.");
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="min-w-60 flex-[0_1_360px]">
			<Input
				label="Token de los overlays"
				readOnly
				value={`••••••••••••••••${token.slice(-4)}`}
				hint="Va en las URL de alertas, eventos, meta y escenas."
				error={error}
				className="[&_input]:font-mono"
				trailingButton={{ label: "Rotar", icon: RefreshCw01, onClick: () => setConfirming(true) }}
			/>
			<Modal
				open={confirming}
				icon={RefreshCw01}
				color="warning"
				title="¿Rotar el token?"
				description="El de ahora deja de valer al momento. Las URL viejas de alertas, eventos, meta y escenas dejarán de funcionar hasta que pegues las nuevas en OBS."
				onClose={() => setConfirming(false)}
				actions={
					<div className="flex w-full gap-3">
						<Button
							hierarchy="secondary"
							size="lg"
							className="flex-1"
							onClick={() => setConfirming(false)}
						>
							Cancelar
						</Button>
						<Button
							hierarchy="primary"
							size="lg"
							destructive
							className="flex-1"
							loading={busy}
							onClick={rotate}
						>
							Rotar token
						</Button>
					</div>
				}
			/>
		</div>
	);
}
