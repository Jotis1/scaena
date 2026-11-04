// Sesión del estudio: quién ha entrado y de qué canal es. El canal sale de la sesión (el id de Twitch de la
// cuenta), nunca de la URL: con varios canales, cada persona solo ve el suyo (design.md, decisiones 9 y 14).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export interface StudioSession {
	name: string;
	/** Id de Twitch de la cuenta: el canal del estudio. */
	channelId: string;
}

export async function readSession(requestHeaders: Headers): Promise<StudioSession | null> {
	const a = auth();
	const session = await a.api.getSession({ headers: requestHeaders });
	if (!session) return null;
	const accounts = await a.api.listUserAccounts({ headers: requestHeaders });
	const twitch = accounts.find((c) => c.providerId === "twitch");
	return twitch ? { name: session.user.name, channelId: twitch.accountId } : null;
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
