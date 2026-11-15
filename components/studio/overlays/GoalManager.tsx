"use client";

import { Accordion, Alert, Button, Checkbox, Select } from "@jotis-me/react";
import { RefreshCw01, Trash01 } from "@untitledui/icons";
import { useId, useState } from "react";
import { GoalSourceIcon } from "@/components/brand/GoalSourceIcon";
import type { GoalOverview } from "@/lib/alerts/goal-view";
import type { GoalRef, GoalShow, GoalState } from "@/lib/alerts/saved-goal";
import { DEFAULT_GOAL, GoalEditor } from "./GoalEditor";

// Las metas en el estudio (specs/obs-overlays, «Meta editable en el estudio», «Meta de Twitch», «Qué meta sale»,
// «Rotación de metas» y «Meta cumplida en la rotación»; design.md del cambio goal-selector-and-rotation, decisión 7).
// Es el mismo panel en la pieza «Meta» y en el bloque «Meta» de las escenas: un solo ajuste para todo.

const MAX_GOALS = 5;
const ROTATE = "rotate";
// Con punto de miles también en las de cuatro cifras, como la barra de la meta («1.210»).
const NUM = new Intl.NumberFormat("es-ES", { useGrouping: "always" });
const num = (n: number) => NUM.format(n);
const progress = (g: GoalState) => `${num(g.current)} de ${num(g.target)}`;

async function send(method: "PUT" | "DELETE", body?: unknown, query = ""): Promise<GoalOverview | string> {
	const res = await fetch(`/api/studio/settings${query}`, {
		method,
		headers: body ? { "content-type": "application/json" } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	}).catch(() => null);
	const json = (await res?.json().catch(() => null)) as
		| (GoalOverview & { fields?: Record<string, string>; error?: string })
		| null;
	if (res?.ok && json) return json;
	return Object.values(json?.fields ?? {})[0] ?? json?.error ?? "No se ha podido guardar. Prueba otra vez.";
}

export function GoalManager({
	panel,
	onChange,
	onDraft,
}: {
	panel: GoalOverview;
	onChange: (p: GoalOverview) => void;
	/** Para la vista previa, mientras se escribe una meta. */
	onDraft: (g: GoalState | null) => void;
}) {
	const id = useId();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const all = [...panel.goals, ...panel.twitchGoals];
	const show = panel.show;
	const rotating = show?.kind === "rotate";
	const selected = rotating ? ROTATE : (show?.ref ?? panel.goals[0]?.ref);

	const apply = async (method: "PUT" | "DELETE", body?: unknown, query?: string) => {
		setBusy(true);
		const r = await send(method, body, query);
		setBusy(false);
		if (typeof r === "string") return setError(r);
		setError(null);
		onChange(r);
	};
	const choose = (value: string) => {
		if (value === ROTATE) {
			const items = all.map((g) => ({ ref: g.ref, whenDone: "keep" as const }));
			return apply("PUT", { show: { kind: "rotate", every: 10, items } satisfies GoalShow });
		}
		return apply("PUT", { show: { kind: "one", ref: value as GoalRef } });
	};
	const rotation = show?.kind === "rotate" ? show : null;
	const setRotation = (patch: Partial<Extract<GoalShow, { kind: "rotate" }>>) =>
		rotation ? apply("PUT", { show: { ...rotation, ...patch } }) : undefined;
	const item = (ref: GoalRef) => rotation?.items.find((i) => i.ref === ref);
	const toggleItem = (ref: GoalRef, on: boolean) => {
		if (!rotation) return;
		const items = on
			? // En el orden de la lista: primero las de Scaena y luego las de Twitch.
				all
					.filter((g) => g.ref === ref || item(g.ref))
					.map((g) => item(g.ref) ?? { ref: g.ref, whenDone: "keep" as const })
			: rotation.items.filter((i) => i.ref !== ref);
		return setRotation({ items });
	};
	const whenDone = (ref: GoalRef, v: "keep" | "drop") =>
		rotation
			? setRotation({ items: rotation.items.map((i) => (i.ref === ref ? { ...i, whenDone: v } : i)) })
			: undefined;

	const options = [
		...all.map((g) => ({
			value: g.ref,
			label: g.label,
			supporting: progress(g),
			textValue: g.label,
			icon: <GoalSourceIcon source={g.source} />,
		})),
		...(all.length > 1 ? [{ value: ROTATE, label: "Rotar", icon: RefreshCw01 }] : []),
	];

	return (
		<div className="flex flex-col gap-6">
			{panel.endedTwitch ? (
				<Alert
					color="warning"
					title="Tu meta de Twitch ha terminado"
					description={`«${panel.endedTwitch}» ya no está activa en Twitch, así que ha vuelto a salir tu primera meta de Scaena.`}
					actions={
						<Button
							hierarchy="link-color"
							size="sm"
							onClick={() => apply("PUT", { dismissEnded: true })}
						>
							Entendido
						</Button>
					}
				/>
			) : null}

			<section aria-label="Qué meta sale" className="flex flex-col gap-4">
				{panel.goals.length ? (
					<Select
						label="Qué meta sale"
						hint="Vale para la pieza de meta y para las escenas, y llega en directo a OBS."
						value={selected}
						disabled={busy}
						onChange={(v) => choose(v)}
						options={options}
					/>
				) : (
					<p className="text-sm text-tertiary">
						Añade tu primera meta debajo. Hasta entonces, la pieza usa la meta de su URL.
					</p>
				)}

				{rotation ? (
					<fieldset className="flex flex-col gap-4 rounded-xl border border-secondary p-4">
						<legend className="px-1 text-sm font-medium text-secondary">Metas que rotan</legend>
						<ul className="flex flex-col gap-3">
							{all.map((g) => {
								const it = item(g.ref);
								const onlyOne = Boolean(it) && rotation.items.length === 1;
								return (
									<li
										key={g.ref}
										className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
									>
										<span className="flex items-center gap-2">
											<Checkbox
												label={
													<span className="flex items-center gap-2">
														<GoalSourceIcon source={g.source} />
														{g.label}
													</span>
												}
												hint={
													onlyOne ? "Tiene que quedar al menos una." : progress(g)
												}
												checked={Boolean(it)}
												disabled={busy || onlyOne}
												onChange={(e) => toggleItem(g.ref, e.target.checked)}
											/>
										</span>
										{it ? (
											<div className="w-60">
												<Select
													size="sm"
													aria-label={`Al cumplirse «${g.label}»`}
													value={it.whenDone}
													disabled={busy}
													onChange={(v) => whenDone(g.ref, v as "keep" | "drop")}
													options={[
														{ value: "keep", label: "Seguir al cumplirse" },
														{ value: "drop", label: "Sacar de la rotación" },
													]}
												/>
											</div>
										) : null}
									</li>
								);
							})}
						</ul>
						<div className="w-56">
							<Select
								label="Cada cuánto cambia"
								value={String(rotation.every)}
								disabled={busy}
								onChange={(v) => setRotation({ every: Number(v) as 10 | 20 | 30 })}
								options={[
									{ value: "10", label: "Cada 10 segundos" },
									{ value: "20", label: "Cada 20 segundos" },
									{ value: "30", label: "Cada 30 segundos" },
								]}
							/>
						</div>
						<p className="text-sm text-tertiary">
							La pieza y las escenas van a la vez. Una meta de Twitch que termina sale sola de
							la rotación.
						</p>
					</fieldset>
				) : null}
				{error ? (
					<p role="alert" className="text-sm text-error-primary">
						{error}
					</p>
				) : null}
			</section>

			<section aria-labelledby={`${id}-own`} className="flex flex-col gap-4">
				<p id={`${id}-own`} className="text-md font-semibold text-primary">
					Tus metas
				</p>
				{panel.goals.length ? (
					<Accordion
						divider
						headingLevel={4}
						items={panel.goals.map((g, i) => ({
							id: g.ref,
							title: (
								<span className="flex items-center gap-2">
									<GoalSourceIcon source="scaena" />
									{g.label}
									<span className="text-sm font-normal text-tertiary">
										{progress(g)}
										{i === 0 ? " · la de por defecto" : ""}
									</span>
								</span>
							),
							content: (
								<div className="flex flex-col gap-4">
									<GoalEditor
										key={g.ref}
										goal={g}
										onDraft={onDraft}
										onSaved={(r) => {
											onDraft(null);
											onChange(r);
										}}
									/>
									<div>
										<Button
											hierarchy="secondary"
											size="sm"
											iconLeading={Trash01}
											disabled={busy || panel.goals.length === 1}
											onClick={() =>
												apply(
													"DELETE",
													undefined,
													`?goal=${g.ref.replace(/^scaena:/, "")}`,
												)
											}
										>
											Borrar «{g.label}»
										</Button>
										{panel.goals.length === 1 ? (
											<p className="mt-2 text-sm text-tertiary">
												Tiene que quedar al menos una meta.
											</p>
										) : null}
									</div>
								</div>
							),
						}))}
					/>
				) : null}
				{panel.goals.length < MAX_GOALS ? (
					<div className="flex flex-col gap-3 rounded-xl border border-secondary p-4">
						<p className="text-sm font-semibold text-primary">
							{panel.goals.length ? "Otra meta" : "Tu primera meta"}
						</p>
						<GoalEditor
							goal={null}
							onDraft={(g) => onDraft({ ...g, ref: DEFAULT_GOAL.ref })}
							onSaved={(r) => {
								onDraft(null);
								onChange(r);
							}}
						/>
					</div>
				) : (
					<p className="text-sm text-tertiary">Como mucho, 5 metas. Borra una para añadir otra.</p>
				)}
			</section>

			<section aria-labelledby={`${id}-twitch`} className="flex flex-col gap-3">
				<p id={`${id}-twitch`} className="text-md font-semibold text-primary">
					En Twitch
				</p>
				{panel.twitchGoals.length ? (
					<ul className="flex flex-col gap-2">
						{panel.twitchGoals.map((g) => (
							<li key={g.ref} className="flex items-center gap-2 text-sm text-secondary">
								<GoalSourceIcon source="twitch" />
								<span className="font-medium text-primary">{g.label}</span>
								<span className="text-tertiary">{progress(g)}</span>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-tertiary">No hay metas activas en Twitch.</p>
				)}
				<p className="text-sm text-tertiary">
					Se editan en el panel de creador de Twitch. Aquí solo se eligen en «Qué meta sale».
				</p>
			</section>
		</div>
	);
}
