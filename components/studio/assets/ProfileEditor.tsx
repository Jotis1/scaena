"use client";

import { Accordion, Button, ButtonUtility, Checkbox, Input, Modal, Select, Textarea } from "@jotis-me/react";
import { Check, Plus, RefreshCcw01, Trash01 } from "@untitledui/icons";
import { useState } from "react";
import { PROFILE_ICON_NAMES } from "@/lib/icons";
import type { EditableKey, Profile, ProfileEdits } from "@/lib/profile";
import { DAY_NAMES } from "@/lib/profile/schedule";
import { DAYS } from "@/lib/profile/schema";
import { SOCIAL_NAMES } from "@/lib/profile/socials";

/** Los campos que se editan aquí, en el orden de los bloques. */
const KEYS: readonly EditableKey[] = [
	"tagline",
	"description",
	"schedule",
	"socials",
	"rules",
	"panels",
	"banner",
];

/** De dónde sale el texto de un panel que no tiene el suyo. */
const FROM_TEXT = { description: "la descripción", rules: "las normas" } as const;
const ROWS_TEXT = { schedule: "el horario", socials: "las redes" } as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Solo lo que difiere del perfil del repositorio: así un cambio en el repositorio sigue llegando a lo no tocado. */
export function editsOf(draft: Profile, base: Profile): ProfileEdits {
	return Object.fromEntries(
		KEYS.filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(base[k])).map((k) => [k, draft[k]]),
	) as ProfileEdits;
}

type Status = "idle" | "saving" | "saved" | "failed" | "reset";

/**
 * «Contenido del canal», en Recursos (specs/twitch-profile-assets, «Editar el contenido de los recursos»): el lema, la
 * descripción, el horario, las redes, las normas, los paneles y la línea del banner. El borrador es del cliente y la
 * vista previa de los paneles y el banner lo sigue al momento (`onDraft`). Al guardar, el servidor valida con las
 * mismas reglas que el perfil del repositorio y cada error sale en su campo.
 */
export function ProfileEditor({
	draft,
	saved,
	base,
	onDraft,
	onSaved,
}: {
	draft: Profile;
	/** Lo último guardado: con él se sabe si hay cambios. */
	saved: Profile;
	/** El perfil del repositorio, al que se vuelve con «Volver a los valores por defecto». */
	base: Profile;
	onDraft: (p: Profile) => void;
	onSaved: (p: Profile) => void;
}) {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<Status>("idle");
	const [confirming, setConfirming] = useState(false);
	const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
	const custom = Object.keys(editsOf(saved, base)).length > 0;

	const set = (patch: Partial<Profile>) => {
		onDraft({ ...draft, ...patch });
		setStatus("idle");
	};
	const err = (path: string) => errors[path];

	const save = async () => {
		setStatus("saving");
		const res = await fetch("/api/studio/profile", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ edits: editsOf(draft, base) }),
		}).catch(() => null);
		const body = res
			? ((await res.json().catch(() => ({}))) as { profile?: Profile; fields?: Record<string, string> })
			: {};
		if (res?.ok && body.profile) {
			setErrors({});
			onSaved(body.profile);
			setStatus("saved");
			return;
		}
		setErrors(body.fields ?? {});
		setStatus("failed");
	};

	const reset = async () => {
		const res = await fetch("/api/studio/profile", { method: "DELETE" }).catch(() => null);
		setConfirming(false);
		if (!res?.ok) {
			setStatus("failed");
			return;
		}
		setErrors({});
		onSaved(base);
		setStatus("reset");
	};

	const list = (
		key: "description" | "rules",
		label: string,
		{ min, max }: { min: number; max: number },
	) => {
		const items = draft[key];
		const update = (next: string[]) => set({ [key]: next } as Partial<Profile>);
		return (
			<div className="flex flex-col gap-3">
				{items.map((text, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: la posición es lo que identifica cada línea.
					<div key={i} className="flex items-start gap-2">
						<div className="min-w-0 flex-1">
							<Textarea
								label={`${label} ${i + 1}`}
								value={text}
								rows={2}
								error={err(`${key}.${i}`)}
								onChange={(e) => update(items.map((t, j) => (j === i ? e.target.value : t)))}
							/>
						</div>
						<ButtonUtility
							icon={Trash01}
							label={`Quitar ${label.toLowerCase()} ${i + 1}`}
							hierarchy="tertiary"
							className="mt-7"
							disabled={items.length <= min}
							onClick={() => update(items.filter((_, j) => j !== i))}
						/>
					</div>
				))}
				{items.length < max ? (
					<div>
						<Button
							hierarchy="secondary"
							size="sm"
							iconLeading={Plus}
							onClick={() => update([...items, ""])}
						>
							{`Añadir ${label.toLowerCase()}`}
						</Button>
					</div>
				) : null}
				{err(key) ? <p className="text-sm text-error-primary">{err(key)}</p> : null}
			</div>
		);
	};

	const s = draft.schedule;
	const days = s.days ?? [];
	const setSchedule = (patch: Partial<Profile["schedule"]>) => set({ schedule: { ...s, ...patch } });

	const items = [
		{
			id: "tagline",
			title: "Lema y descripción",
			content: (
				<div className="flex flex-col gap-4">
					<Input
						label="Lema"
						value={draft.tagline}
						error={err("tagline")}
						hint="Sale en el banner y en la portada."
						onChange={(e) => set({ tagline: e.target.value })}
					/>
					{list("description", "Párrafo", { min: 1, max: 4 })}
				</div>
			),
		},
		{
			id: "schedule",
			title: "Horario",
			content: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-4">
						<div className="w-40">
							<Input
								label="Empieza"
								type="time"
								value={s.start}
								error={err("schedule.start")}
								onChange={(e) => setSchedule({ start: e.target.value })}
							/>
						</div>
						<div className="w-40">
							<Input
								label="Acaba"
								type="time"
								value={s.end}
								error={err("schedule.end") ?? err("schedule")}
								onChange={(e) => setSchedule({ end: e.target.value })}
							/>
						</div>
						<div className="min-w-0 flex-[1_1_220px]">
							<Input
								label="Zona horaria"
								value={s.zone}
								error={err("schedule.zone")}
								onChange={(e) => setSchedule({ zone: e.target.value })}
							/>
						</div>
					</div>
					<fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
						<legend className="mb-2 text-sm font-medium text-secondary">
							Días (sin ninguno, «Sin fijar»)
						</legend>
						<div className="flex flex-wrap gap-x-6 gap-y-2">
							{DAYS.map((d) => (
								<Checkbox
									key={d}
									label={capitalize(DAY_NAMES[d])}
									checked={days.includes(d)}
									onChange={(e) => {
										const next = e.target.checked
											? DAYS.filter((x) => x === d || days.includes(x))
											: days.filter((x) => x !== d);
										setSchedule({ days: next.length ? next : undefined });
									}}
								/>
							))}
						</div>
					</fieldset>
				</div>
			),
		},
		{
			id: "socials",
			title: "Redes",
			content: (
				<div className="flex flex-col gap-4">
					{draft.socials.map((r, i) => (
						<div key={r.network} className="flex flex-wrap gap-4">
							<div className="min-w-0 flex-[1_1_200px]">
								<Input
									label={`${SOCIAL_NAMES[r.network]}: usuario`}
									value={r.text}
									error={err(`socials.${i}.text`)}
									onChange={(e) =>
										set({
											socials: draft.socials.map((x, j) =>
												j === i ? { ...x, text: e.target.value } : x,
											),
										})
									}
								/>
							</div>
							<div className="min-w-0 flex-[2_1_280px]">
								<Input
									label={`${SOCIAL_NAMES[r.network]}: enlace`}
									type="url"
									value={r.url ?? ""}
									hint="Sin enlace, no sale en ningún sitio."
									error={err(`socials.${i}.url`)}
									onChange={(e) =>
										set({
											socials: draft.socials.map((x, j) =>
												j === i
													? { ...x, url: e.target.value.trim() || undefined }
													: x,
											),
										})
									}
								/>
							</div>
						</div>
					))}
				</div>
			),
		},
		{ id: "rules", title: "Normas", content: list("rules", "Norma", { min: 1, max: 5 }) },
		{
			id: "panels",
			title: "Paneles",
			content: (
				<div className="flex flex-col gap-6">
					{draft.panels.map((pn, i) => {
						const setPanel = (patch: Partial<typeof pn>) =>
							set({ panels: draft.panels.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
						return (
							<fieldset
								key={pn.slug}
								className="m-0 flex flex-col gap-4 rounded-xl border border-secondary p-4"
							>
								<legend className="px-1 text-sm font-semibold text-primary">{`Panel «${pn.title}»`}</legend>
								<div className="flex flex-wrap gap-4">
									<div className="min-w-0 flex-[2_1_220px]">
										<Input
											label="Título"
											value={pn.title}
											error={err(`panels.${i}.title`)}
											onChange={(e) => setPanel({ title: e.target.value })}
										/>
									</div>
									<div className="min-w-0 flex-[1_1_160px]">
										<Select
											label="Icono"
											value={pn.icon}
											onChange={(v) => setPanel({ icon: v as typeof pn.icon })}
											options={PROFILE_ICON_NAMES.map((n) => ({ value: n, label: n }))}
										/>
									</div>
								</div>
								{pn.from ? (
									<p className="text-sm text-tertiary">{`El texto sale de ${FROM_TEXT[pn.from]}: se cambia arriba.`}</p>
								) : (
									(pn.paragraphs ?? []).map((t, k) => (
										<Textarea
											// biome-ignore lint/suspicious/noArrayIndexKey: la posición identifica el párrafo.
											key={k}
											label={`Texto ${k + 1}`}
											rows={2}
											value={t}
											error={err(`panels.${i}.paragraphs.${k}`)}
											onChange={(e) =>
												setPanel({
													paragraphs: (pn.paragraphs ?? []).map((x, m) =>
														m === k ? e.target.value : x,
													),
												})
											}
										/>
									))
								)}
								{pn.rows ? (
									<p className="text-sm text-tertiary">{`Las filas salen de ${ROWS_TEXT[pn.rows]}.`}</p>
								) : null}
								{pn.action ? (
									<div className="flex flex-wrap gap-4">
										<div className="min-w-0 flex-[1_1_200px]">
											<Input
												label="Texto del botón"
												value={pn.action.text}
												error={err(`panels.${i}.action.text`)}
												onChange={(e) =>
													setPanel({
														action: {
															...(pn.action as NonNullable<typeof pn.action>),
															text: e.target.value,
														},
													})
												}
											/>
										</div>
										<div className="min-w-0 flex-[2_1_280px]">
											<Input
												label="Enlace del botón"
												type="url"
												value={pn.action.url}
												error={err(`panels.${i}.action.url`)}
												onChange={(e) =>
													setPanel({
														action: {
															...(pn.action as NonNullable<typeof pn.action>),
															url: e.target.value,
														},
													})
												}
											/>
										</div>
									</div>
								) : null}
							</fieldset>
						);
					})}
				</div>
			),
		},
		{
			id: "banner",
			title: "Banner",
			content: (
				<Input
					label="Línea de arriba"
					value={draft.banner.eyebrow}
					error={err("banner.eyebrow")}
					onChange={(e) => set({ banner: { eyebrow: e.target.value } })}
				/>
			),
		},
	];

	return (
		<section aria-labelledby="content-title" className="flex flex-col gap-5">
			<div className="flex flex-col gap-1">
				<h2 id="content-title" className="text-xl font-semibold text-primary">
					Contenido del canal
				</h2>
				<p className="max-w-180 text-sm text-tertiary">
					De aquí salen los paneles, el banner y la web. Lo que cambies se ve abajo al momento; al
					guardar, también en la web.
				</p>
			</div>
			<Accordion divider headingLevel={3} items={items} />
			<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
				<Button
					hierarchy="primary"
					size="md"
					iconLeading={Check}
					loading={status === "saving"}
					disabled={!dirty}
					onClick={save}
				>
					Guardar contenido
				</Button>
				{custom ? (
					<Button
						hierarchy="secondary"
						size="md"
						iconLeading={RefreshCcw01}
						onClick={() => setConfirming(true)}
					>
						Volver a los valores por defecto
					</Button>
				) : null}
				<p role="status" className="text-sm text-tertiary">
					{status === "saved"
						? "Guardado. La web ya lo enseña; vuelve a descargar las imágenes para Twitch."
						: status === "reset"
							? "Vuelve a estar con los valores por defecto."
							: status === "failed"
								? "No se ha guardado: mira el mensaje debajo de cada campo."
								: ""}
				</p>
			</div>
			<Modal
				open={confirming}
				icon={RefreshCcw01}
				color="warning"
				title="¿Volver a los valores por defecto?"
				description="Se borra todo lo que has cambiado aquí y el contenido vuelve a los valores por defecto de tu canal."
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
						<Button hierarchy="primary" size="lg" destructive className="flex-1" onClick={reset}>
							Volver a los de por defecto
						</Button>
					</div>
				}
			/>
		</section>
	);
}
