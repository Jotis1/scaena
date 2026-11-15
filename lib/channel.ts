// Canal de Scaena a partir del login de la URL: tiene que tener perfil y su id sale de Twitch.
import { loadProfile, type Profile, repoProfileOf } from "./profile";
import { helixDeps } from "./twitch/server";
import { channelIdFromLogin } from "./twitch/users";

/** El perfil del canal, con los cambios del estudio, o `null` si el login no tiene perfil. */
export async function profileOf(login: string): Promise<Profile | null> {
	try {
		repoProfileOf(login);
	} catch {
		return null;
	}
	return loadProfile(login);
}

/** Id de Twitch de un canal de Scaena, o `null` si el login no tiene perfil. */
export async function channelIdOf(login: string): Promise<string | null> {
	try {
		return await channelIdFromLogin(helixDeps(), repoProfileOf(login).twitch.login);
	} catch (e) {
		if (e instanceof Error && e.message.startsWith("No hay perfil")) return null;
		throw e;
	}
}
