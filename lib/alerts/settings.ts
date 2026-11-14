// Ajustes de las alertas por canal, en `channel:<id>:settings` (design.md, decisión 9): las frases y la meta guardada
// (`saved-goal.ts`).
// Sin frase guardada para un tipo, manda la del perfil. Al guardar se avisa por el flujo SSE (`settings`), así
// que el overlay de alertas usa la frase nueva sin recargar la fuente.
import { z } from "zod";
import { alertPhrase, PLACEHOLDERS, type Profile } from "../profile/schema";
import { keys } from "../redis/keys";
import type { Store } from "../storage/types";
import { ALERT_TYPES } from "../twitch/eventsub/event";
import { GOAL_TYPES } from "./goal";
import type { AlertPhrases } from "./phrase";

export const settingsSchema = z.object({
	alerts: z
		.object({
			follow: alertPhrase,
			sub: alertPhrase,
			resub: alertPhrase,
			gift: alertPhrase,
			raid: alertPhrase,
			bits: alertPhrase,
		})
		.partial(),
	/** La meta del canal (specs/obs-overlays, «Meta editable en el estudio»). La cuenta va aparte, en `:goal`. */
	goal: z
		.object({
			type: z.enum(GOAL_TYPES),
			label: z
				.string()
				.trim()
				.min(1, "Escribe el texto de la meta.")
				.max(40, "Como mucho, 40 caracteres."),
			target: z
				.number({ message: "El objetivo tiene que ser un número." })
				.int("El objetivo tiene que ser un número entero.")
				.min(1, "El objetivo tiene que ser mayor que cero.")
				.max(10_000_000, "El objetivo es demasiado grande."),
			unit: z.string().trim().max(20, "Como mucho, 20 caracteres.").optional(),
		})
		.optional(),
});

export type AlertSettings = z.infer<typeof settingsSchema>;

/** Nombre del evento SSE que lleva las frases. */
export const SETTINGS_EVENT = "settings";

export class SettingsError extends Error {
	constructor(public readonly fields: Record<string, string>) {
		super("Hay frases que no se pueden guardar.");
		this.name = "SettingsError";
	}
}

export const PLACEHOLDER_HINT = `Lo que va entre llaves se rellena solo: ${PLACEHOLDERS.map((h) => `{${h}}`).join(", ")}.`;

export async function readSettings(store: Store, channelId: string): Promise<AlertSettings> {
	const raw = await store.get<unknown>(keys.channel(channelId, "settings"));
	const r = settingsSchema.safeParse(typeof raw === "string" ? JSON.parse(raw) : (raw ?? { alerts: {} }));
	// Algo guardado que ya no vale (por ejemplo, tras cambiar las reglas) no rompe el overlay: manda el perfil.
	return r.success ? r.data : { alerts: {} };
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
	// Guardar las frases no toca la meta.
	const { goal } = await readSettings(store, channelId);
	const r = settingsSchema.safeParse({ alerts: cleaned, goal });
	if (!r.success) {
		const fields: Record<string, string> = {};
		for (const i of r.error.issues) fields[String(i.path.at(-1))] ??= i.message;
		throw new SettingsError(fields);
	}
	await store.set(keys.channel(channelId, "settings"), r.data);
	const phrases = effectivePhrases(profile, r.data);
	await store.xadd(keys.channel(channelId, "events"), {
		type: SETTINGS_EVENT,
		data: JSON.stringify({ alerts: phrases }),
	});
	return phrases;
}
