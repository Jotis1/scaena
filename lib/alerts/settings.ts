// Ajustes de las alertas por canal, en `channel:<id>:settings` (design.md, decisión 9): las frases, las metas de
// Scaena y qué meta sale (`saved-goal.ts`; design.md del cambio goal-selector-and-rotation, decisión 1).
// Sin frase guardada para un tipo, manda la del perfil. Al guardar se avisa por el flujo SSE (`settings`), así
// que el overlay de alertas usa la frase nueva sin recargar la fuente.
import { z } from "zod";
import { alertPhrase, PLACEHOLDERS, type Profile } from "../profile/schema";
import { GOAL_ID, keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { ALERT_TYPES } from "../twitch/eventsub/event";
import { GOAL_TYPES } from "./goal";
import { type AlertPhrases, phraseError } from "./phrase";

const alertsSchema = z
	.object({
		follow: alertPhrase,
		sub: alertPhrase,
		resub: alertPhrase,
		gift: alertPhrase,
		raid: alertPhrase,
		bits: alertPhrase,
	})
	.partial();

/** Lo que se edita de una meta de Scaena (specs/obs-overlays, «Meta editable en el estudio»). */
export const goalFieldsSchema = z.object({
	type: z.enum(GOAL_TYPES),
	label: z.string().trim().min(1, "Escribe el texto de la meta.").max(40, "Como mucho, 40 caracteres."),
	target: z
		.number({ message: "El objetivo tiene que ser un número." })
		.int("El objetivo tiene que ser un número entero.")
		.min(1, "El objetivo tiene que ser mayor que cero.")
		.max(10_000_000, "El objetivo es demasiado grande."),
	unit: z.string().trim().max(20, "Como mucho, 20 caracteres.").optional(),
});

/** Una meta de Scaena guardada. Su cuenta va aparte, en `channel:<id>:goal:<id>`. */
export const goalConfigSchema = goalFieldsSchema.extend({ id: z.string().regex(GOAL_ID) });

/** Como mucho, 5 metas de Scaena (specs/obs-overlays, «Meta editable en el estudio»). */
export const MAX_GOALS = 5;

/** A qué meta se refiere una elección: `scaena:<id>` o `twitch:<id de la meta de Twitch>`. */
export const goalRefSchema = z.string().regex(/^(scaena|twitch):[\w-]{1,64}$/);
export type GoalRef = `scaena:${string}` | `twitch:${string}`;

export const ROTATE_EVERY = [10, 20, 30] as const;

/** Qué meta sale (specs/obs-overlays, «Qué meta sale» y «Rotación de metas»). Sin él, la primera de Scaena. */
export const showSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("one"), ref: goalRefSchema }),
	z.object({
		kind: z.literal("rotate"),
		every: z.union([z.literal(10), z.literal(20), z.literal(30)]),
		items: z
			.array(z.object({ ref: goalRefSchema, whenDone: z.enum(["keep", "drop"]) }))
			.min(1, "Marca al menos una meta para rotar.")
			.max(30),
	}),
]);
export type GoalShow = z.infer<typeof showSchema>;

export const settingsSchema = z.object({
	alerts: alertsSchema,
	/** Antigua (0.3.0): la única meta guardada. `readGoals` la pasa a `goals` la primera vez. */
	goal: goalFieldsSchema.optional(),
	goals: z.array(goalConfigSchema).max(MAX_GOALS).optional(),
	show: showSchema.optional(),
	/** Descripción de la meta de Twitch elegida que terminó: el estudio lo avisa hasta que se cierra. */
	endedTwitch: z.string().max(80).optional(),
});

export type AlertSettings = z.infer<typeof settingsSchema>;
export type GoalConfig = z.infer<typeof goalConfigSchema>;

/** Nombre del evento SSE que lleva las frases. */
export const SETTINGS_EVENT = "settings";

export class SettingsError extends Error {
	constructor(
		public readonly fields: Record<string, string>,
		message = "Hay frases que no se pueden guardar.",
	) {
		super(message);
		this.name = "SettingsError";
	}
}

export const PLACEHOLDER_HINT = `Lo que va entre llaves se rellena solo: ${PLACEHOLDERS.map((h) => `{${h}}`).join(", ")}.`;

export async function readSettings(store: Store, channelId: string): Promise<AlertSettings> {
	const raw = await store.get<unknown>(keys.channel(channelId, "settings"));
	let data: Record<string, unknown> = {};
	try {
		const v = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (v && typeof v === "object") data = v as Record<string, unknown>;
	} catch {}
	// Cada parte por su lado: algo guardado que ya no vale (por ejemplo, tras cambiar las reglas) no se lleva lo
	// demás. Unas frases que no valen dejan las del perfil; una elección que no vale, la meta por defecto.
	const part = <T>(schema: z.ZodType<T>, v: unknown): T | undefined => {
		const r = schema.safeParse(v);
		return r.success ? r.data : undefined;
	};
	const out: AlertSettings = { alerts: part(alertsSchema, data.alerts) ?? {} };
	const goal = part(goalFieldsSchema, data.goal);
	const goals = part(z.array(goalConfigSchema).max(MAX_GOALS), data.goals);
	const show = part(showSchema, data.show);
	const ended = part(z.string().max(80), data.endedTwitch);
	if (goal) out.goal = goal;
	if (goals) out.goals = goals;
	if (show) out.show = show;
	if (ended) out.endedTwitch = ended;
	return out;
}

/** Frases que se usan de verdad: las guardadas y, donde no hay, las del perfil. */
export function effectivePhrases(profile: Profile, s: AlertSettings): AlertPhrases {
	return Object.fromEntries(ALERT_TYPES.map((t) => [t, s.alerts[t] ?? profile.alerts[t]])) as AlertPhrases;
}

/**
 * Valida y guarda. Una frase vacía o igual a la del perfil se quita, para que vuelva a mandar el perfil.
 * Avisa a los overlays abiertos con las frases resultantes.
 */
export async function saveSettings(
	store: Store,
	channelId: string,
	profile: Profile,
	input: unknown,
): Promise<AlertPhrases> {
	const alerts = (input as { alerts?: Record<string, unknown> } | null)?.alerts ?? {};
	const cleaned: Record<string, unknown> = {};
	for (const t of ALERT_TYPES) {
		const v = alerts[t];
		if (typeof v === "string" && (v.trim() === "" || v.trim() === profile.alerts[t])) continue;
		if (v !== undefined) cleaned[t] = v;
	}
	// Cada frase, con los huecos de su tipo: la misma regla que enseña el estudio mientras se escribe.
	const fields: Record<string, string> = {};
	for (const t of ALERT_TYPES) {
		const v = cleaned[t];
		const error = typeof v === "string" ? phraseError(t, v) : null;
		if (error) fields[t] = error;
	}
	// Guardar las frases no toca las metas ni la elección.
	const current = await readSettings(store, channelId);
	const r = settingsSchema.safeParse({ ...current, alerts: cleaned });
	if (!r.success) for (const i of r.error.issues) fields[String(i.path.at(-1))] ??= i.message;
	if (!r.success || Object.keys(fields).length) throw new SettingsError(fields);
	await store.set(keys.channel(channelId, "settings"), r.data);
	const phrases = effectivePhrases(profile, r.data);
	await store.xadd(keys.channel(channelId, "events"), {
		type: SETTINGS_EVENT,
		data: JSON.stringify({ alerts: phrases }),
	});
	return phrases;
}
