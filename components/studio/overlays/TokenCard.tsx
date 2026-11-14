"use client";

import { Button, CardHeader, Input, Modal } from "@jotis-me/react";
import { Lock01, RefreshCw01 } from "@untitledui/icons";
import { useState } from "react";

/**
 * «Token de los overlays» (diseño: «Overlays» y «Rotar token»; specs/obs-overlays, «Rotar el token»): el token tapado
 * y «Rotar token», que pide confirmación con un `Modal` destructivo. Ese es el único botón principal de la página.
 */
export function TokenCard({ token, onRotated }: { token: string; onRotated: (t: string) => void }) {
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
		<section
			aria-label="Token de los overlays"
			className="overflow-hidden rounded-xl border border-secondary bg-primary"
		>
			<CardHeader
				title="Token de los overlays"
				description="Va en las URL de alertas, eventos y meta. Si se filtra, rótalo y vuelve a pegar esas tres en OBS."
			/>
			<div className="flex flex-col gap-3 px-6 pt-5 pb-6">
				<div className="flex flex-wrap items-end gap-3">
					<div className="min-w-0 flex-[1_1_220px]">
						<Input
							label="Token"
							readOnly
							value={`••••••••••••••••••••${token.slice(-4)}`}
							icon={Lock01}
							className="[&_input]:font-mono"
						/>
					</div>
					<Button
						hierarchy="secondary"
						size="md"
						iconLeading={RefreshCw01}
						onClick={() => setConfirming(true)}
					>
						Rotar token
					</Button>
				</div>
				{error ? (
					<p role="alert" className="text-sm text-error-primary">
						{error}
					</p>
				) : null}
			</div>
			<Modal
				open={confirming}
				icon={RefreshCw01}
				destructive
				title="¿Rotar el token?"
				description="El actual deja de valer al momento. Las URL de alertas, eventos y meta no funcionarán hasta que pegues las nuevas en OBS."
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
		</section>
	);
}
