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
