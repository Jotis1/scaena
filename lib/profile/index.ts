// Acceso al perfil del canal. Todo lo lee con `getProfile(channel)` (design.md, decisión 14): hoy devuelve
// el YAML del repositorio; mañana puede leer una base de datos sin cambiar a quien lo usa.
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

let cache: Profile | undefined;

function configuredProfile(): Profile {
	cache ??= parseProfile(readFileSync(PROFILE_PATH, "utf8"));
	return cache;
}

/** Perfil del canal pedido, por su usuario de Twitch. Hoy solo existe el configurado. */
export function getProfile(channel: string): Profile {
	const profile = configuredProfile();
	if (channel.toLowerCase() !== profile.twitch.login)
		throw new Error(
			`No hay perfil para el canal «${channel}». El configurado es «${profile.twitch.login}».`,
		);
	return profile;
}

/** El canal configurado, para las páginas que no llevan canal en la URL (la web pública). */
export function getMainProfile(): Profile {
	return configuredProfile();
}
