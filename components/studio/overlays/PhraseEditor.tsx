"use client";

import { Button, Input } from "@jotis-me/react";
import { Check, Play } from "@untitledui/icons";
import { useState } from "react";
import { type AlertPhrases, fillPhrase, PHRASE_HOLES, phraseError } from "@/lib/alerts/phrase";
import { TEST_ALERTS } from "@/lib/studio/test-alerts";
import type { AlertType } from "@/lib/twitch/eventsub/event";

/**
 * Pruebas y frases de cada alerta, en el detalle de «Alertas» (diseño: «Overlays - pieza Alertas»; specs/obs-overlays,
 * «Frases de alerta editables», y specs/twitch-events, «Disparo de prueba»). Una fila por tipo: el botón manda una
 * alerta de prueba a OBS con la frase guardada, y al lado se edita la frase. Los huecos de cada tipo se comprueban
 * mientras se escribe, con la misma regla que el servidor (`phraseError`). `onPreview` dice qué tipo enseñar arriba.
 */
export function PhraseEditor({
	phrases,
	onSaved,
	onPreview,
}: {
	phrases: AlertPhrases;
	onSaved: (p: AlertPhrases) => void;
	onPreview: (type: AlertType, draft: AlertPhrases) => void;
}) {
	const [draft, setDraft] = useState(phrases);
	const [serverErrors, setServerErrors] = useState<Partial<Record<AlertType, string>>>({});
	const [status, setStatus] = useState<string>("Las pruebas usan la frase guardada.");
	const [saving, setSaving] = useState(false);
	const errors = Object.fromEntries(
		TEST_ALERTS.map(({ type }) => [type, phraseError(type, draft[type]) ?? serverErrors[type]]),
	) as Record<AlertType, string | undefined>;
	const bad = Object.values(errors).some(Boolean);

	const test = async (type: AlertType, label: string) => {
		onPreview(type, draft);
		const res = await fetch("/api/studio/test", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ type }),
		}).catch(() => null);
		setStatus(
			res?.ok
				? `Prueba enviada a OBS: ${label}.`
				: "La prueba no ha salido. Comprueba la conexión y vuelve a probar.",
		);
	};

	const save = async () => {
		setSaving(true);
		const res = await fetch("/api/studio/settings", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ alerts: draft }),
		}).catch(() => null);
		setSaving(false);
		if (res?.ok) {
			const body = (await res.json()) as { alerts: AlertPhrases };
			setServerErrors({});
			setDraft(body.alerts);
			onSaved(body.alerts);
			setStatus("Guardadas. La próxima alerta ya sale con ellas.");
			return;
		}
		const body = res ? ((await res.json().catch(() => ({}))) as { fields?: Record<string, string> }) : {};
		setServerErrors(body.fields ?? {});
		setStatus("Hay frases que no se pueden guardar: mira el mensaje debajo de cada una.");
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1">
				<h4 className="text-sm font-semibold text-primary">Prueba y frase de cada alerta</h4>
				<p className="text-sm text-tertiary">
					El botón manda una alerta de prueba a OBS. Al lado, lo que dice. Los huecos entre llaves
					se rellenan solos.
				</p>
			</div>
			<div className="flex flex-col gap-4">
				{TEST_ALERTS.map(({ type, label, event }) => {
					const holes = PHRASE_HOLES[type];
					const now = fillPhrase(draft[type] || "", { type, ...event });
					return (
						<div key={type} className="flex flex-wrap items-start gap-x-4 gap-y-2">
							<div className="flex flex-[0_0_216px]">
								<Button
									hierarchy="secondary"
									size="md"
									iconLeading={Play}
									onClick={() => test(type, label)}
								>
									{label}
								</Button>
							</div>
							<div className="min-w-0 flex-[1_1_300px]">
								<Input
									aria-label={`Frase de ${label.toLowerCase()}`}
									maxLength={120}
									value={draft[type]}
									error={errors[type]}
									hint={
										holes.length
											? `Se rellena solo: ${holes.map((h) => `{${h}}`).join(", ")}. Ahora dice: ${now}`
											: "Sin huecos: se enseña tal cual. Vacía, vuelve la del perfil."
									}
									onChange={(e) => {
										const next = { ...draft, [type]: e.target.value };
										setDraft(next);
										setServerErrors((s) => ({ ...s, [type]: undefined }));
										onPreview(type, next);
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
				<Button
					hierarchy="primary"
					size="md"
					iconLeading={Check}
					loading={saving}
					disabled={bad}
					onClick={save}
				>
					Guardar frases
				</Button>
				<p role="status" className="text-sm text-tertiary">
					{bad ? "Hay una frase que no vale: mira el mensaje bajo su campo." : status}
				</p>
			</div>
		</div>
	);
}
