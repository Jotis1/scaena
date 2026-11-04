// Canal de Scaena a partir del login de la URL: tiene que tener perfil (`getProfile`) y su id sale de Twitch.
import { getProfile, type Profile } from "./profile";
import { helixDeps } from "./twitch/server";
import { channelIdFromLogin } from "./twitch/users";

export function profileOf(login: string): Profile | null {
	try {
		return getProfile(login);
	} catch {
		return null;
	}
}

/** Id de Twitch de un canal de Scaena, o `null` si el login no tiene perfil. */
export async function channelIdOf(login: string): Promise<string | null> {
	const profile = profileOf(login);
	return profile ? channelIdFromLogin(helixDeps(), profile.twitch.login) : null;
}
