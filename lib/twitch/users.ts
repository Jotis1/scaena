// Id de Twitch de un canal a partir de su login (design.md, decisión 8). Las claves de Redis van por id, y el
// perfil y las URL por login: el paso de uno a otro se pregunta a Helix una vez y se guarda.
import { keys } from "../redis/keys";
import { type HelixDeps, helixJson } from "./helix";

/** El id de un usuario no cambia nunca; el login sí puede cambiar, así que se vuelve a mirar cada semana. */
const TTL_SEC = 7 * 24 * 60 * 60;

export class UnknownChannelError extends Error {
	constructor(login: string) {
		super(`Twitch no tiene ningún canal «${login}».`);
		this.name = "UnknownChannelError";
	}
}

export async function channelIdFromLogin(d: HelixDeps, login: string): Promise<string> {
	const key = keys.idFromLogin(login);
	const cached = await d.store.get<string>(key);
	if (cached) return String(cached);
	const { data } = await helixJson<{ data: { id: string }[] }>(
		d,
		`/users?login=${encodeURIComponent(login.toLowerCase())}`,
	);
	const id = data[0]?.id;
	if (!id) throw new UnknownChannelError(login);
	await d.store.set(key, id, { ex: TTL_SEC });
	return id;
}

/** Lo que enseña «Cuentas» de una cuenta de Twitch antes de darle acceso (specs/studio-accounts, «Añadir una cuenta»). */
export interface TwitchUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
	description: string;
}

/** Usuarios de Twitch: letras, cifras y guiones bajos, de 4 a 25 caracteres. */
export const TWITCH_LOGIN = /^\w{4,25}$/;

/** Busca una cuenta de Twitch por su usuario; `null` si no existe o el usuario no es válido. */
export async function twitchUserByLogin(d: HelixDeps, login: string): Promise<TwitchUser | null> {
	const l = login.trim().replace(/^@/, "").toLowerCase();
	if (!TWITCH_LOGIN.test(l)) return null;
	const { data } = await helixJson<{
		data: {
			id: string;
			login: string;
			display_name: string;
			description: string;
			profile_image_url: string;
		}[];
	}>(d, `/users?login=${encodeURIComponent(l)}`);
	const u = data[0];
	if (!u) return null;
	return {
		id: u.id,
		login: u.login,
		name: u.display_name || u.login,
		image: u.profile_image_url || null,
		description: u.description ?? "",
	};
}
