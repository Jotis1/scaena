// «Cuentas»: dar y quitar acceso al estudio (specs/studio-accounts; design.md del cambio multi-channel-studio,
// decisión 7). Separado de la ruta para probarlo con dependencias falsas. Solo lo usan los administradores: la ruta lo
// comprueba antes de llamar aquí.
import type { TwitchUser } from "../twitch/users";
import type { ChannelRegistry, StudioChannelRow } from "./channels";

export interface AccountsDeps {
	registry: ChannelRegistry;
	/** Administradores: los ids de la configuración. No se quitan desde «Cuentas». */
	adminIds: readonly string[];
	findUser: (login: string) => Promise<TwitchUser | null>;
	/** Cierra todas las sesiones de la cuenta de Twitch con ese id. */
	endSessions: (twitchId: string) => Promise<void>;
	/** Da de baja las suscripciones de EventSub de ese canal. */
	unsubscribe: (twitchId: string) => Promise<void>;
}

export interface AccountView {
	twitchId: string;
	login: string;
	name: string;
	image: string | null;
	admin: boolean;
	/** Nombre de quien la añadió, si la añadió alguien que sigue en la lista. */
	addedByName: string | null;
	createdAt: string;
}

export interface AccountsReply {
	status: number;
	body: unknown;
}

const view =
	(rows: StudioChannelRow[], adminIds: readonly string[]) =>
	(r: StudioChannelRow): AccountView => ({
		twitchId: r.twitchId,
		login: r.login,
		name: r.name,
		image: r.image,
		admin: adminIds.includes(r.twitchId),
		addedByName: r.addedBy ? (rows.find((x) => x.twitchId === r.addedBy)?.name ?? null) : null,
		createdAt: r.createdAt.toISOString(),
	});

/** Las cuentas con acceso: primero los administradores, luego las añadidas, por orden de llegada. */
export async function listAccounts(d: AccountsDeps): Promise<AccountView[]> {
	const rows = await d.registry.list();
	const all = rows.map(view(rows, d.adminIds));
	return [...all.filter((a) => a.admin), ...all.filter((a) => !a.admin)];
}

/** Busca una cuenta de Twitch para enseñarla antes de darle acceso. */
export async function lookupAccount(d: AccountsDeps, login: string): Promise<AccountsReply> {
	const user = await d.findUser(login);
	if (!user) return { status: 404, body: { error: "No hay ninguna cuenta de Twitch con ese nombre." } };
	const already = d.adminIds.includes(user.id) || Boolean(await d.registry.byId(user.id));
	return { status: 200, body: { user, already } };
}

/** Da acceso a una cuenta de Twitch, que entra con su propio canal. */
export async function addAccount(d: AccountsDeps, byId: string, login: string): Promise<AccountsReply> {
	const user = await d.findUser(login);
	if (!user) return { status: 404, body: { error: "No hay ninguna cuenta de Twitch con ese nombre." } };
	if (d.adminIds.includes(user.id) || (await d.registry.byId(user.id)))
		return { status: 409, body: { error: `${user.name} ya tiene acceso al estudio.` } };
	await d.registry.add({
		twitchId: user.id,
		login: user.login,
		name: user.name,
		image: user.image,
		description: user.description,
		addedBy: byId,
	});
	return { status: 200, body: { accounts: await listAccounts(d) } };
}

/**
 * Quita el acceso: cierra sus sesiones, da de baja sus eventos y borra su fila. Sus datos se quedan, así que volver a
 * añadirla lo recupera todo. Si falla la baja de los eventos, el acceso se quita igual y se dice.
 */
export async function removeAccount(d: AccountsDeps, twitchId: string): Promise<AccountsReply> {
	if (d.adminIds.includes(twitchId))
		return { status: 403, body: { error: "Un administrador no se puede quitar desde «Cuentas»." } };
	const row = await d.registry.byId(twitchId);
	if (!row) return { status: 404, body: { error: "Esa cuenta ya no tiene acceso." } };
	await d.endSessions(twitchId);
	let warning: string | undefined;
	try {
		await d.unsubscribe(twitchId);
	} catch (e) {
		console.error("Cuentas: no se han podido dar de baja los eventos:", e);
		warning = `${row.name} ya no tiene acceso, pero sus eventos siguen dados de alta en Twitch: no se ven en ningún sitio mientras no tenga acceso, y se dan de baja si vuelve y pulsa «Desconectar».`;
	}
	await d.registry.remove(twitchId);
	return { status: 200, body: { accounts: await listAccounts(d), ...(warning ? { warning } : {}) } };
}

/**
 * La API de «Cuentas» (`/api/studio/accounts`), solo para administradores: `GET` lista (o busca con `?login=`),
 * `POST { login }` añade y `DELETE ?id=` quita.
 */
export async function handleAccounts(
	session: { channelId: string; admin: boolean },
	request: { method: string; url: string; body?: unknown },
	d: AccountsDeps,
): Promise<AccountsReply> {
	if (!session.admin)
		return { status: 403, body: { error: "Solo los administradores gestionan las cuentas." } };
	const url = new URL(request.url);
	if (request.method === "GET") {
		const login = url.searchParams.get("login");
		return login ? lookupAccount(d, login) : { status: 200, body: { accounts: await listAccounts(d) } };
	}
	if (request.method === "POST") {
		const login = (request.body as { login?: unknown } | null)?.login;
		if (typeof login !== "string" || !login.trim())
			return { status: 400, body: { error: "Escribe el usuario de Twitch." } };
		return addAccount(d, session.channelId, login);
	}
	if (request.method === "DELETE") {
		const id = url.searchParams.get("id");
		if (!id || !/^\d+$/.test(id))
			return { status: 400, body: { error: "Falta la cuenta que se quita (`?id=`)." } };
		return removeAccount(d, id);
	}
	return { status: 405, body: { error: "Método no permitido." } };
}
