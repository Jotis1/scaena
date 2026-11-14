"use client";

import { Button, Input } from "@jotis-me/react";
import { Check } from "@untitledui/icons";
import { useState } from "react";
import type { AlertPhrases } from "@/lib/alerts/phrase";
import type { AlertType } from "@/lib/twitch/eventsub/event";

const PHRASE_LABELS: Record<AlertType, string> = {
	follow: "Follow",
	sub: "Sub",
	resub: "Renovación",
	gift: "Subs regaladas",
	raid: "Raid",
	bits: "Bits",
};

/**
 * Frases de alerta, una por tipo, dentro de la tarjeta «Alertas» (diseño: «Overlays - piezas»; specs/obs-overlays,
 * «Frases de alerta editables»). El servidor valida los huecos y dice cuáles valen.
 */
export function PhraseEditor({
	phrases,
	onSaved,
}: {
	phrases: AlertPhrases;
	onSaved: (p: AlertPhrases) => void;
}) {
	const [draft, setDraft] = useState(phrases);
	const [errors, setErrors] = useState<Partial<Record<AlertType, string>>>({});
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
	const save = async () => {
		setStatus("saving");
		const res = await fetch("/api/studio/settings", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ alerts: draft }),
		}).catch(() => null);
		if (res?.ok) {
			const body = (await res.json()) as { alerts: AlertPhrases };
			setErrors({});
			setDraft(body.alerts);
			onSaved(body.alerts);
			setStatus("saved");
			return;
		}
		const body = res ? ((await res.json().catch(() => ({}))) as { fields?: Record<string, string> }) : {};
		setErrors(body.fields ?? {});
		setStatus("failed");
	};
	return (
		<>
			<div className="grid basis-full grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
				{(Object.keys(PHRASE_LABELS) as AlertType[]).map((t) => (
					<Input
						key={t}
						label={PHRASE_LABELS[t]}
						size="sm"
						maxLength={120}
						value={draft[t]}
						error={errors[t]}
						onChange={(e) => {
							setDraft((d) => ({ ...d, [t]: e.target.value }));
							setStatus("idle");
						}}
					/>
				))}
			</div>
			<p className="basis-full text-[13px] leading-[18px] text-tertiary">
				Una frase por tipo. Lo que va entre llaves se rellena solo: {"{meses}"}, {"{cantidad}"},{" "}
				{"{espectadores}"} y {"{bits}"}. Vacía, vuelve la del perfil.
			</p>
			<div className="flex basis-full items-center gap-3">
				<Button
					hierarchy="secondary"
					size="sm"
					iconLeading={Check}
					loading={status === "saving"}
					onClick={save}
				>
					Guardar frases
				</Button>
				<span aria-live="polite" className="text-sm text-tertiary">
					{status === "saved"
						? "Guardadas. La próxima alerta ya sale con ellas."
						: status === "failed"
							? "Hay frases que no se pueden guardar: mira el mensaje debajo de cada una."
							: ""}
				</span>
			</div>
		</>
	);
}
