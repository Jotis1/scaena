// Esquema del perfil del canal (specs/channel-profile, design.md, decisión 8). Es la única fuente del
// contenido: la web, las escenas, los paneles y el banner leen de aquí y no repiten textos por su cuenta.

import { z } from "zod";
import { PROFILE_ICON_NAMES } from "../icons";

/** Emojis y pictogramas: la guía de Regula no los admite en la interfaz. */
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}]/u;

/** Texto visible en la interfaz: no vacío y sin emojis. */
export const uiText = z
	.string()
	.trim()
	.min(1, "no puede estar vacío")
	.refine((s) => !EMOJI.test(s), "sin emojis: la guía de Regula no los admite");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "hora en formato HH:mm, de 00:00 a 23:59");

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/**
 * Huecos que se rellenan solos en las frases de alerta (specs/obs-overlays, «Frases de alerta»). Van en
 * castellano porque se escriben y se leen en el estudio.
 */
export const PLACEHOLDERS = ["meses", "cantidad", "espectadores", "bits"] as const;

export const alertPhrase = uiText.max(120, "como mucho 120 caracteres").superRefine((s, ctx) => {
	for (const [, name] of s.matchAll(/\{([^}]*)\}/g))
		if (!(PLACEHOLDERS as readonly string[]).includes(name as string))
			ctx.addIssue({
				code: "custom",
				message: `hueco «{${name}}» no válido; se pueden usar ${PLACEHOLDERS.map((h) => `{${h}}`).join(", ")}`,
			});
});

const icon = z.enum(PROFILE_ICON_NAMES, {
	message: `no es un icono del perfil; se pueden usar ${PROFILE_ICON_NAMES.join(", ")}`,
});

const scene = z.object({
	badge: uiText,
	title: uiText.max(24, "como mucho 24 caracteres (guía de Regula)"),
	subtitle: uiText,
});

/** Un paso de «Cómo va un directo» (diseño: «Portada»). */
const step = z.object({
	/** El nombre del paso en la barra de pasos: «La partida». */
	title: uiText.max(24, "como mucho 24 caracteres"),
	/** La línea bajo el nombre: «Modo historia». Sin ella, en «Antes» va la hora de inicio de la franja. */
	hint: uiText.max(24, "como mucho 24 caracteres").optional(),
	/** El titular junto a la escena. */
	heading: uiText,
	text: uiText,
	/** Dónde pasa: va en la etiqueta junto al titular. */
	where: z.enum(["twitch", "youtube"]),
});

const panel = z
	.object({
		slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "solo minúsculas, cifras y guiones"),
		title: uiText,
		icon,
		paragraphs: z.array(uiText).min(1).max(4).optional(),
		/** Párrafos que salen de otra parte del perfil, para no repetirlos aquí. */
		from: z.enum(["description", "rules"]).optional(),
		/** Filas que salen de otra parte del perfil. */
		rows: z.enum(["schedule", "socials"]).optional(),
		action: z.object({ text: uiText, url: z.url() }).optional(),
	})
	.refine((p) => Boolean(p.paragraphs) !== Boolean(p.from), {
		message: "pon `paragraphs` o `from`, uno de los dos",
		path: ["paragraphs"],
	});

const social = z.object({
	network: z.enum(["twitch", "youtube", "discord"]),
	text: uiText,
	/** Sin enlace, la red no se muestra (specs/channel-profile, «Enlaces opcionales»). */
	url: z.url().optional(),
});

const profileObject = z.object({
	/** Nombre con el que se presenta el canal: "Jotis". */
	name: uiText,
	twitch: z.object({
		login: z.string().regex(/^[a-z0-9_]{3,25}$/, "usuario de Twitch en minúsculas, de 3 a 25 caracteres"),
	}),
	youtube: z.object({
		handle: z.string().regex(/^@[\w.-]{3,30}$/, "handle de YouTube con @, como @jotis_1"),
	}),
	tagline: uiText,
	description: z.array(uiText).min(1).max(4),
	/** Textos propios de la web: qué es (portada) y la línea del pie. */
	site: z.object({ intro: uiText, footer: uiText }),
	/** «Cómo va un directo» en la portada: los cuatro pasos, en este orden. */
	journey: z.object({ before: step, game: step, chatting: step, after: step }),
	schedule: z
		.object({
			start: time,
			end: time,
			days: z.array(z.enum(DAYS)).optional(),
			zone: uiText,
		})
		.refine((h) => h.start !== h.end, { message: "el inicio y el fin no pueden ser la misma hora" }),
	/** Qué se emite: «Juegos», «Just Chatting». */
	streams: z.array(uiText).min(1),
	banner: z.object({ eyebrow: uiText }),
	socials: z.array(social).min(1),
	rules: z.array(uiText).min(1).max(5),
	panels: z.array(panel).min(1).max(10),
	scenes: z.object({ starting: scene, brb: scene, ending: scene, offline: scene }),
	alerts: z.object({
		follow: alertPhrase,
		sub: alertPhrase,
		resub: alertPhrase,
		gift: alertPhrase,
		raid: alertPhrase,
		bits: alertPhrase,
	}),
	camera: z.object({ name: uiText }),
	chat: z.object({ hidden: z.array(z.string().trim().toLowerCase()).default([]) }),
});

/** Sin slugs de panel ni redes repetidas. */
const noRepeats = (
	p: { panels: { slug: string }[]; socials: { network: string }[] },
	ctx: z.RefinementCtx,
) => {
	const slugs = p.panels.map((x) => x.slug);
	slugs.forEach((s, i) => {
		if (slugs.indexOf(s) !== i)
			ctx.addIssue({
				code: "custom",
				path: ["panels", i, "slug"],
				message: `slug repetido: «${s}»`,
			});
	});
	const networks = p.socials.map((r) => r.network);
	networks.forEach((r, i) => {
		if (networks.indexOf(r) !== i)
			ctx.addIssue({
				code: "custom",
				path: ["socials", i, "network"],
				message: `red repetida: «${r}»`,
			});
	});
};

/**
 * El perfil de cualquier canal, tal como lo usan el estudio y los overlays (design.md del cambio multi-channel-studio,
 * decisión 4). Para un canal añadido desde «Cuentas», YouTube es opcional y qué se emite, las normas y los paneles
 * pueden ir vacíos: empiezan así y se rellenan en Recursos.
 */
export const profileSchema = profileObject
	.extend({
		youtube: profileObject.shape.youtube.optional(),
		streams: z.array(uiText),
		rules: z.array(uiText).max(5),
		panels: z.array(panel).max(10),
	})
	.superRefine(noRepeats);

/**
 * El perfil del canal principal (`content/channel.yaml` y sus cambios en el estudio): alimenta la web, así que tiene
 * que tenerlo todo (specs/channel-profile, «Perfil de un canal añadido», «El principal sigue exigiéndolo todo»).
 */
export const repoProfileSchema = profileObject.superRefine(noRepeats);

export type Profile = z.infer<typeof profileSchema>;
export type RepoProfile = z.infer<typeof repoProfileSchema>;
export type Day = (typeof DAYS)[number];
