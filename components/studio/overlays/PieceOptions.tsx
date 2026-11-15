"use client";

import { Alert, Input, Select, Toggle } from "@jotis-me/react";
import type { AlertPhrases } from "@/lib/alerts/phrase";
import type { GoalState } from "@/lib/alerts/saved-goal";
import type { SourceOptions } from "@/lib/studio/overlay-urls";
import type { AlertType } from "@/lib/twitch/eventsub/event";
import { GoalEditor } from "./GoalEditor";
import { PhraseEditor } from "./PhraseEditor";

// Opciones de cada pieza (specs/obs-overlays, «Página de URLs para copiar» y «Opciones de cada pieza en las escenas»).
// Las usa la pieza suelta y, dentro de un bloque por pieza, las escenas montadas: así son las mismas en los dos sitios.

export interface OptionsProps {
	o: SourceOptions;
	set: (patch: SourceOptions) => void;
}

export function ChatOptions({ o, set, translucent = true }: OptionsProps & { translucent?: boolean }) {
	return (
		<div className="flex flex-wrap gap-x-10 gap-y-4">
			{translucent ? (
				<Toggle
					size="sm"
					label="Fondo translúcido"
					hint="Deja ver el juego por detrás."
					checked={o.translucent}
					onChange={(v) => set({ translucent: v })}
				/>
			) : null}
			<Toggle
				size="sm"
				label="Animar el último mensaje"
				hint="Entra con un fundido corto."
				checked={o.animate}
				onChange={(v) => set({ animate: v })}
			/>
		</div>
	);
}

export function AlertOptions({
	o,
	set,
	phrases,
	onSaved,
	onPreview,
}: OptionsProps & {
	phrases: AlertPhrases;
	onSaved: (saved: AlertPhrases) => void;
	onPreview: (type: AlertType, draft: AlertPhrases) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<Toggle
				size="sm"
				label="Enseñar el mensaje del espectador"
				hint="El que escribe al renovar o al mandar bits."
				checked={o.message}
				onChange={(v) => set({ message: v })}
			/>
			<PhraseEditor phrases={phrases} onSaved={onSaved} onPreview={onPreview} />
		</div>
	);
}

export function EventOptions({ o, set }: OptionsProps) {
	return (
		<div className="w-45">
			<Select
				label="Filas visibles"
				size="sm"
				value={String(o.rows)}
				onChange={(v) => set({ rows: Number(v) })}
				options={["2", "3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
			/>
		</div>
	);
}

export function StatusOptions({ o, set }: OptionsProps) {
	return (
		<Toggle
			size="sm"
			label="Enseñar espectadores"
			hint="El número, al lado del tiempo en emisión."
			checked={o.viewers}
			onChange={(v) => set({ viewers: v })}
		/>
	);
}

export function CameraOptions({
	o,
	set,
	defaultName,
	ratio = true,
}: OptionsProps & { defaultName: string; ratio?: boolean }) {
	return (
		<div className="flex flex-wrap gap-4">
			{ratio ? (
				<div className="flex-[0_1_160px]">
					<Select
						label="Proporción"
						size="sm"
						value={o.ratio}
						onChange={(v) => set({ ratio: v })}
						options={["16:9", "4:3", "1:1"].map((v) => ({ value: v, label: v }))}
					/>
				</div>
			) : null}
			<div className="flex-[0_1_260px]">
				<Input
					label="Nombre"
					size="sm"
					maxLength={40}
					value={o.name ?? defaultName}
					onChange={(e) => set({ name: e.target.value })}
				/>
			</div>
		</div>
	);
}

/**
 * La meta: con una meta de Twitch activa, se dice que sale esa y que se cambia en Twitch; la de Scaena se sigue
 * editando debajo, para cuando no haya ninguna (specs/obs-overlays, «Meta de Twitch»).
 */
export function GoalOptions({
	goal,
	twitchGoal,
	onSaved,
	onDraft,
}: {
	goal: GoalState | null;
	twitchGoal: GoalState | null;
	onSaved: (g: GoalState) => void;
	onDraft: (g: GoalState) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			{twitchGoal ? (
				<Alert
					color="brand"
					title="Ahora sale tu meta de Twitch"
					description={`«${twitchGoal.label}», ${twitchGoal.current} de ${twitchGoal.target}. Se cambia en el panel de creador de Twitch; la de aquí vuelve cuando la de Twitch acabe.`}
				/>
			) : null}
			<GoalEditor
				goal={goal}
				onSaved={onSaved}
				onDraft={onDraft}
				hint={twitchGoal ? "Se usa cuando no hay meta en Twitch." : undefined}
			/>
		</div>
	);
}
