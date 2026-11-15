// Canal de Scaena a partir del login de la URL: el principal o uno añadido desde «Cuentas» (design.md del cambio
// multi-channel-studio, decisiones 3 y 6).
import { findProfile, type Profile, repoProfile } from "./profile";
import { channelRegistry } from "./studio/channels";
import { helixDeps } from "./twitch/server";
import { channelIdFromLogin } from "./twitch/users";

/** El perfil del canal, con los cambios del estudio, o `null` si el login no es de ningún canal de Scaena. */
export function profileOf(login: string): Promise<Profile | null> {
	return findProfile(login);
}

/**
 * Id de Twitch de un canal de Scaena, o `null` si el login no es de ninguno. Un canal añadido lo tiene en su fila
 * de «Cuentas», sin preguntar a Twitch; el principal, si aún no tiene fila, por Helix con su caché.
 */
export async function channelIdOf(login: string): Promise<string | null> {
	const l = login.toLowerCase();
	const row = await (await channelRegistry()).byLogin(l).catch(() => null);
	if (row) return row.twitchId;
	if (l !== repoProfile().twitch.login) return null;
	return channelIdFromLogin(helixDeps(), l);
}
