"use client";

import { Button, Input, Select } from "@jotis-me/react";
import { Check } from "@untitledui/icons";
import { useState } from "react";
import { GOAL_LABELS, type GoalType } from "@/lib/alerts/goal";
import type { GoalState } from "@/lib/alerts/saved-goal";

/** Meta que se enseña mientras no hay ninguna guardada. */
export const DEFAULT_GOAL: GoalState = { type: "subs", label: GOAL_LABELS.subs, target: 100, current: 0 };

type Field = "type" | "label" | "target" | "current";
const digits = (v: string) => Number(v.replace(/\D/g, "")) || 0;

/**
 * La meta del canal, dentro de la tarjeta «Meta» (specs/obs-overlays, «Meta editable en el estudio»). Se guarda en
 * Scaena y llega en directo a la pieza y a las escenas: no hay que volver a pegar la URL. «Llevas» solo se manda si
 * se cambia, para no pisar lo que haya sumado el directo mientras tanto.
 */
export function GoalEditor({
	goal,
	onSaved,
	onDraft,
}: {
	goal: GoalState | null;
	onSaved: (g: GoalState) => void;
	/** Para la vista previa, mientras se escribe. */
	onDraft: (g: GoalState) => void;
}) {
	const loaded = goal ?? DEFAULT_GOAL;
	const [draft, setDraftState] = useState(loaded);
	const [base, setBase] = useState(loaded.current);
	const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
	const setDraft = (patch: Partial<GoalState>) => {
		const next = { ...draft, ...patch };
		setDraftState(next);
		onDraft(next);
		setStatus("idle");
	};

	const save = async () => {
		setStatus("saving");
		const { current, ...config } = draft;
		const res = await fetch("/api/studio/settings", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ goal: config, ...(current !== base || !goal ? { current } : {}) }),
		}).catch(() => null);
		if (res?.ok) {
			const body = (await res.json()) as { goal: GoalState };
			setErrors({});
			setDraftState(body.goal);
			setBase(body.goal.current);
			onSaved(body.goal);
			setStatus("saved");
			return;
		}
		const body = res ? ((await res.json().catch(() => ({}))) as { fields?: Record<string, string> }) : {};
		setErrors(body.fields ?? {});
		setStatus("failed");
	};

	return (
		<>
			<div className="w-38">
				<Select
					label="Tipo"
					size="sm"
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
			<div className="w-45">
				<Input
					label="Texto"
					size="sm"
					value={draft.label}
					maxLength={40}
					error={errors.label}
					onChange={(e) => setDraft({ label: e.target.value })}
				/>
			</div>
			<div className="w-28">
				<Input
					label="Objetivo"
					size="sm"
					inputMode="numeric"
					value={String(draft.target)}
					error={errors.target}
					onChange={(e) => setDraft({ target: digits(e.target.value) })}
				/>
			</div>
			<div className="w-28">
				<Input
					label="Llevas"
					size="sm"
					inputMode="numeric"
					value={String(draft.current)}
					error={errors.current}
					onChange={(e) => setDraft({ current: digits(e.target.value) })}
				/>
			</div>
			<p className="basis-full text-[13px] leading-[18px] text-tertiary">
				Se usa en la pieza de meta y en las escenas de juego y Just Chatting, y llega en directo: no
				hace falta volver a pegar la URL. Cambiar el texto o el objetivo no toca la cuenta; «Llevas»
				la corrige.
			</p>
			<div className="flex basis-full items-center gap-3">
				<Button
					hierarchy="secondary"
					size="sm"
					iconLeading={Check}
					loading={status === "saving"}
					onClick={save}
				>
					Guardar meta
				</Button>
				<span aria-live="polite" className="text-sm text-tertiary">
					{status === "saved"
						? "Guardada. La pieza y las escenas ya la enseñan."
						: status === "failed"
							? "La meta no se ha guardado: mira el mensaje debajo de cada campo."
							: ""}
				</span>
			</div>
		</>
	);
}
