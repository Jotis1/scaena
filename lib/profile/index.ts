// Acceso al perfil del canal: el YAML del repositorio con los cambios del estudio encima (specs/channel-profile,
// «Contenido del canal en un solo sitio»; design.md del cambio studio-sidebar-twitch-goals-editable-profile, decisión 8).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { parse } from "yaml";
import type { z } from "zod";
import { type Profile, profileSchema } from "./schema";

export type { Day, Profile } from "./schema";

export const PROFILE_PATH = join(process.cwd(), "content", "channel.yaml");

export class ProfileError extends Error {
	constructor(public readonly problems: string[]) {
		super(`El perfil del canal (content/channel.yaml) no es válido:\n- ${problems.join("\n- ")}`);
		this.name = "ProfileError";
	}
}

/** `panels.2.paragraphs.0` → `panels[2] («normas»).paragraphs[0]`: así se sabe qué panel es sin contar. */
function describePath(path: PropertyKey[], data: unknown): string {
	let node: unknown = data;
	let out = "";
	for (const part of path) {
		const parent = node;
		node = node && typeof node === "object" ? (node as Record<PropertyKey, unknown>)[part] : undefined;
		if (typeof part === "number") {
			out += `[${part}]`;
			const slug = (node as { slug?: unknown } | undefined)?.slug;
			if (Array.isArray(parent) && typeof slug === "string") out += ` («${slug}»)`;
		} else out += out ? `.${String(part)}` : String(part);
	}
	return out || "(raíz)";
}

function problemsOf(error: z.ZodError, data: unknown): string[] {
	return error.issues.map((i) => `${describePath(i.path, data)}: ${i.message}`);
}

/** Lee y valida un perfil en YAML. Lanza `ProfileError` con un problema por campo. */
export function parseProfile(yaml: string): Profile {
	let data: unknown;
	try {
		data = parse(yaml);
	} catch (e) {
		throw new ProfileError([`YAML mal formado: ${e instanceof Error ? e.message : String(e)}`]);
	}
	const r = profileSchema.safeParse(data);
	if (!r.success) throw new ProfileError(problemsOf(r.error, data));
	return r.data;
}

let repoCache: Profile | undefined;

/**
 * El perfil del repositorio, sin los cambios del estudio. Vale para lo que no se edita (el usuario de Twitch y el
 * handle de YouTube) y como valores por defecto de lo demás.
 */
export function repoProfile(): Profile {
	repoCache ??= parseProfile(readFileSync(PROFILE_PATH, "utf8"));
	return repoCache;
}

/** Campos del perfil que se pueden cambiar desde el estudio (Recursos). El resto solo cambia en el repositorio. */
export const EDITABLE_KEYS = [
	"tagline",
	"description",
	"schedule",
	"socials",
	"rules",
	"panels",
	"banner",
] as const;
export type EditableKey = (typeof EDITABLE_KEYS)[number];
export type ProfileEdits = Partial<Pick<Profile, EditableKey>>;

export interface LoadedProfile {
	profile: Profile;
	/** Campos guardados que ya no valen y se han cambiado por los del repositorio. */
	invalidFields: EditableKey[];
}

const isEditable = (k: string): k is EditableKey => (EDITABLE_KEYS as readonly string[]).includes(k);

/** Solo los campos editables de lo guardado; lo demás se ignora. */
function editsOf(data: unknown): Record<string, unknown> {
	if (!data || typeof data !== "object" || Array.isArray(data)) return {};
	return Object.fromEntries(Object.entries(data).filter(([k]) => isEditable(k)));
}

/**
 * El perfil del repositorio con lo guardado encima. Si lo guardado deja de valer (por ejemplo, tras un despliegue que
 * cambia las reglas), se quitan los campos con errores y se usan los del repositorio (specs/channel-profile, «Cambios
 * del perfil validados»).
 */
export function mergeProfile(base: Profile, data: unknown): LoadedProfile {
	const edits = editsOf(data);
	const invalid = new Set<EditableKey>();
	for (let i = 0; i <= EDITABLE_KEYS.length; i++) {
		const kept = Object.fromEntries(
			Object.entries(edits).filter(([k]) => !invalid.has(k as EditableKey)),
		);
		const r = profileSchema.safeParse({ ...base, ...kept });
		if (r.success) return { profile: r.data, invalidFields: [...invalid] };
		const bad = r.error.issues.map((x) => String(x.path[0])).filter(isEditable);
		// Un error que no cae en ningún campo editable deja el perfil del repositorio tal cual.
		if (bad.length === 0) break;
		for (const k of bad) invalid.add(k);
	}
	return { profile: base, invalidFields: Object.keys(edits).filter(isEditable) };
}

/** Error al guardar cambios del perfil: un mensaje por campo (`rules.2`, `schedule.start`). */
export class ProfileEditsError extends Error {
	constructor(public readonly fields: Record<string, string>) {
		super("Hay campos del perfil que no valen.");
		this.name = "ProfileEditsError";
	}
}

/** Valida unos cambios sobre el perfil del repositorio. Lanza `ProfileEditsError` con un mensaje por campo. */
export function validateEdits(base: Profile, input: unknown): { edits: ProfileEdits; profile: Profile } {
	if (!input || typeof input !== "object" || Array.isArray(input))
		throw new ProfileEditsError({ "": "Los cambios tienen que ser un objeto." });
	const fields: Record<string, string> = {};
	for (const k of Object.keys(input))
		if (!isEditable(k)) fields[k] = "Este campo no se puede cambiar desde el estudio.";
	if (Object.keys(fields).length > 0) throw new ProfileEditsError(fields);
	const edits = input as Record<string, unknown>;
	const r = profileSchema.safeParse({ ...base, ...edits });
	if (!r.success) {
		for (const i of r.error.issues) fields[i.path.map(String).join(".")] ??= i.message;
		throw new ProfileEditsError(fields);
	}
	const profile = r.data;
	const clean = Object.fromEntries(
		Object.keys(edits).map((k) => [k, profile[k as EditableKey]]),
	) as ProfileEdits;
	return { edits: clean, profile };
}

/** Dónde se guardan los cambios del estudio. Por defecto, Postgres (`ChannelProfile`); en las pruebas, en memoria. */
export interface ProfileStore {
	read(login: string): Promise<unknown | null>;
	write(login: string, data: ProfileEdits): Promise<void>;
	clear(login: string): Promise<void>;
}

let storeOverride: ProfileStore | undefined;

/** Solo para pruebas: cambia el almacén del perfil (`undefined` vuelve a Postgres). */
export function setProfileStore(s: ProfileStore | undefined): void {
	storeOverride = s;
}

export async function profileStore(): Promise<ProfileStore> {
	if (storeOverride) return storeOverride;
	const { prismaProfileStore } = await import("./stored");
	return prismaProfileStore;
}

/** El perfil del repositorio del canal pedido. Hoy solo existe el configurado. */
export function repoProfileOf(login: string): Profile {
	const base = repoProfile();
	if (login.toLowerCase() !== base.twitch.login)
		throw new Error(`No hay perfil para el canal «${login}». El configurado es «${base.twitch.login}».`);
	return base;
}

async function load(login: string): Promise<LoadedProfile> {
	const base = repoProfileOf(login);
	let data: unknown = null;
	try {
		data = await (await profileStore()).read(base.twitch.login);
	} catch (e) {
		// Sin base de datos, la web sigue con el perfil del repositorio.
		console.warn(
			`Perfil: no se han podido leer los cambios guardados (${e instanceof Error ? e.message : e}).`,
		);
	}
	const loaded = mergeProfile(base, data);
	if (loaded.invalidFields.length > 0)
		console.warn(`Perfil: cambios guardados que ya no valen: ${loaded.invalidFields.join(", ")}.`);
	return loaded;
}

/** Perfil del canal con los cambios del estudio y los campos guardados que ya no valen. Una lectura por petición. */
export const loadProfileWithIssues = cache((login: string) => load(login.toLowerCase()));

/** Perfil del canal pedido, por su usuario de Twitch, con los cambios del estudio. */
export async function loadProfile(login: string): Promise<Profile> {
	return (await loadProfileWithIssues(login)).profile;
}

/** El canal configurado con sus cambios, para las páginas que no llevan canal en la URL (la web pública). */
export async function loadMainProfile(): Promise<Profile> {
	return loadProfile(repoProfile().twitch.login);
}
