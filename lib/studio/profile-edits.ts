// Guardar y borrar los cambios del perfil desde Recursos (specs/twitch-profile-assets, «Editar el contenido de los
// recursos»; specs/channel-profile, «Cambios del perfil validados»). Solo el dueño del canal: el canal de la sesión
// tiene que ser el del perfil.
import { type Profile, ProfileEditsError, type ProfileStore, validateEdits } from "../profile";

export interface ProfileEditDeps {
	/** Canal de la sesión (id de Twitch). */
	sessionChannelId: string;
	/** Id de Twitch del canal del perfil. */
	profileChannelId: () => Promise<string | null>;
	base: Profile;
	store: ProfileStore;
}

export type ProfileEditResult =
	| { status: 200; body: { profile: Profile } }
	| { status: 403 | 422; body: { error: string; fields?: Record<string, string> } };

async function owner(d: ProfileEditDeps): Promise<boolean> {
	return (await d.profileChannelId()) === d.sessionChannelId;
}

const FORBIDDEN = {
	status: 403,
	body: { error: "Solo el dueño del canal puede cambiar su perfil." },
} as const;

export async function saveProfileEdits(d: ProfileEditDeps, input: unknown): Promise<ProfileEditResult> {
	if (!(await owner(d))) return FORBIDDEN;
	try {
		const { edits, profile } = validateEdits(d.base, (input as { edits?: unknown } | null)?.edits);
		await d.store.write(d.base.twitch.login, edits);
		return { status: 200, body: { profile } };
	} catch (e) {
		if (e instanceof ProfileEditsError)
			return { status: 422, body: { error: e.message, fields: e.fields } };
		throw e;
	}
}

export async function clearProfileEdits(d: ProfileEditDeps): Promise<ProfileEditResult> {
	if (!(await owner(d))) return FORBIDDEN;
	await d.store.clear(d.base.twitch.login);
	return { status: 200, body: { profile: d.base } };
}
