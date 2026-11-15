// Sesión del estudio: quién ha entrado y de qué canal es. El canal sale de la sesión (el id de Twitch de la
// cuenta), nunca de la URL: con varios canales, cada persona solo ve el suyo (design.md, decisiones 9 y 14).
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { env } from "../env";
import { channelRegistry } from "./channels";

export interface StudioSession {
	name: string;
	/** Foto de perfil de Twitch, si la hay. */
	image?: string;
	/** Id de Twitch de la cuenta: el canal del estudio. */
	channelId: string;
	/** Usuario de Twitch del canal: el de sus overlays (`/overlay/<login>/…`) y su perfil. */
	login: string;
	/** Administrador (su id está en la configuración): ve «Cuentas» (specs/studio-accounts, «Administradores»). */
	admin: boolean;
}

export async function readSession(requestHeaders: Headers): Promise<StudioSession | null> {
	// Sin cookie no hay sesión: la web pública no va a la base de datos por cada visita.
	if (!getSessionCookie(requestHeaders)) return null;
	const a = auth();
	const session = await a.api.getSession({ headers: requestHeaders });
	if (!session) return null;
	const accounts = await a.api.listUserAccounts({ headers: requestHeaders });
	const twitch = accounts.find((c) => c.providerId === "twitch");
	if (!twitch) return null;
	const admin = env().STUDIO_ALLOWED_TWITCH_IDS.includes(twitch.accountId);
	const row = await (await channelRegistry()).byId(twitch.accountId);
	// Una cuenta añadida a la que se le ha quitado el acceso ya no vale, aunque su sesión siga en la base de datos.
	if (!admin && !row) return null;
	return {
		name: session.user.name,
		image: session.user.image ?? undefined,
		channelId: twitch.accountId,
		login: row?.login ?? session.user.name.toLowerCase(),
		admin,
	};
}

/** En una página del estudio: la sesión o, si no hay, a la entrada. */
export async function requirePageSession(): Promise<StudioSession> {
	const s = await readSession(await headers());
	if (!s) redirect("/studio/login");
	return s;
}

/** En una ruta de `/api/studio`: la sesión o un 401. */
export async function requireApiSession(request: Request): Promise<StudioSession | Response> {
	return (
		(await readSession(request.headers)) ??
		Response.json({ error: "Hace falta entrar en el estudio." }, { status: 401 })
	);
}
