"use client";

import { Button, Input, NumberInput, Select } from "@jotis-me/react";
import { Check } from "@untitledui/icons";
import { useState } from "react";
import { GOAL_LABELS, type GoalType } from "@/lib/alerts/goal";
import type { GoalOverview } from "@/lib/alerts/goal-view";
import type { GoalState } from "@/lib/alerts/saved-goal";

/** Meta que se enseña mientras no hay ninguna guardada, y con la que empieza una nueva. */
export const DEFAULT_GOAL: GoalState = {
	ref: "scaena:nueva000",
	source: "scaena",
	type: "subs",
	label: GOAL_LABELS.subs,
	target: 100,
	current: 0,
};

/** Lo que devuelve guardar: la meta y todo el panel de metas al día. */
export type GoalSaved = GoalOverview & { goal: GoalState };

type Field = "type" | "label" | "target" | "current";

/**
 * Una meta de Scaena (specs/obs-overlays, «Meta editable en el estudio»). Con `goal`, edita esa; sin él, crea una.
 * Se guarda en Scaena y llega en directo a la pieza y a las escenas: no hay que volver a pegar la URL. «Llevas» solo
 * se manda si se cambia, para no pisar lo que haya sumado el directo mientras tanto.
 */
export function GoalEditor({
	goal,
	onSaved,
	onDraft,
}: {
	goal: GoalState | null;
	onSaved: (r: GoalSaved) => void;
	/** Para la vista previa, mientras se escribe. */
	onDraft: (g: GoalState) => void;
}) {
	const loaded = goal ?? DEFAULT_GOAL;
	const [draft, setDraftState] = useState(loaded);
	const [base, setBase] = useState(loaded.current);
	const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
	const [failure, setFailure] = useState<string | null>(null);
	const setDraft = (patch: Partial<GoalState>) => {
		const next = { ...draft, ...patch };
		setDraftState(next);
		onDraft(next);
		setStatus("idle");
	};

	const save = async () => {
		setStatus("saving");
		const { current, type, label, target, unit } = draft;
		const id = goal ? goal.ref.replace(/^scaena:/, "") : undefined;
		const res = await fetch("/api/studio/settings", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				goal: { ...(id ? { id } : {}), type, label, target, ...(unit ? { unit } : {}) },
				...(current !== base || !goal ? { current } : {}),
			}),
		}).catch(() => null);
		if (res?.ok) {
			const body = (await res.json()) as GoalSaved;
			setErrors({});
			setStatus("saved");
			if (goal) {
				setDraftState(body.goal);
				setBase(body.goal.current);
			} else {
				// Era una meta nueva: el editor vuelve a quedar en blanco para la siguiente.
				setDraftState(DEFAULT_GOAL);
				setBase(0);
			}
			onSaved(body);
			return;
		}
		const body = res
			? ((await res.json().catch(() => ({}))) as { fields?: Record<string, string>; error?: string })
			: {};
		setErrors(body.fields ?? {});
		setFailure(body.fields?.goal ?? null);
		setStatus("failed");
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-start gap-4">
				<div className="flex-[1_1_150px]">
					<Select
						label="Tipo"
						value={draft.type}
						onChange={(v) => {
							const type = v as GoalType;
							// El texto por defecto sigue al tipo; uno escrito a mano se respeta.
							const label =
								draft.label === GOAL_LABELS[draft.type] ? GOAL_LABELS[type] : draft.label;
							setDraft({ type, label });
						}}
						options={[
							{ value: "subs", label: "Subs" },
							{ value: "follows", label: "Seguidores" },
							{ value: "bits", label: "Bits" },
						]}
					/>
				</div>
				<div className="flex-[3_1_240px]">
					<Input
						label="Texto"
						value={draft.label}
						maxLength={40}
						hint="Como mucho, 40 caracteres."
						error={errors.label}
						onChange={(e) => setDraft({ label: e.target.value })}
					/>
				</div>
				<div className="flex-[1_1_150px]">
					{/* Sin mínimo en el campo: el servidor dice por qué no vale 0 (specs/obs-overlays, «Objetivo no válido»). */}
					<NumberInput
						label="Objetivo"
						min={0}
						value={draft.target}
						error={errors.target}
						onChange={(n) => setDraft({ target: Math.max(0, Math.floor(n || 0)) })}
					/>
				</div>
				<div className="flex-[1_1_150px]">
					<NumberInput
						label="Llevas"
						min={0}
						value={draft.current}
						error={errors.current}
						onChange={(n) => setDraft({ current: Math.max(0, Math.floor(n || 0)) })}
					/>
				</div>
			</div>
			<p className="text-sm text-tertiary">
				Al guardar llega en directo, sin tocar OBS. Cambiar el texto o el objetivo no toca la cuenta;
				«Llevas» la corrige.
			</p>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
				<Button
					hierarchy="primary"
					size="md"
					iconLeading={Check}
					loading={status === "saving"}
					onClick={save}
				>
					{goal ? "Guardar meta" : "Añadir meta"}
				</Button>
				<p role="status" className="text-sm text-tertiary">
					{status === "saved"
						? goal
							? "Guardada. La pieza y las escenas ya la enseñan."
							: "Añadida. Ya puedes elegirla en «Qué meta sale»."
						: status === "failed"
							? (failure ?? "La meta no se ha guardado: mira el mensaje debajo de cada campo.")
							: ""}
				</p>
			</div>
		</div>
	);
}
