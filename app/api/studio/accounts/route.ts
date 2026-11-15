import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { type AccountsDeps, handleAccounts } from "@/lib/studio/accounts";
import { channelRegistry } from "@/lib/studio/channels";
import { requireApiSession } from "@/lib/studio/session";
import { disconnect } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps, helixDeps } from "@/lib/twitch/server";
import { twitchUserByLogin } from "@/lib/twitch/users";

// «Cuentas» (specs/studio-accounts; design.md del cambio multi-channel-studio, decisión 7). La lógica y la
// comprobación de administrador van en `lib/studio/accounts.ts`; aquí, las dependencias de verdad.
export const dynamic = "force-dynamic";

async function deps(): Promise<AccountsDeps> {
	return {
		registry: await channelRegistry(),
		adminIds: env().STUDIO_ALLOWED_TWITCH_IDS,
		findUser: (login) => twitchUserByLogin(helixDeps(), login),
		// Las sesiones de better-auth de los usuarios que entran con esa cuenta de Twitch. Su usuario y su cuenta se
		// quedan, para que vuelva a entrar con lo suyo si se le vuelve a dar acceso.
		endSessions: async (twitchId) => {
			const accounts = await db().account.findMany({
				where: { providerId: "twitch", accountId: twitchId },
				select: { userId: true },
			});
			await db().session.deleteMany({ where: { userId: { in: accounts.map((a) => a.userId) } } });
		},
		unsubscribe: async (twitchId) => {
			await disconnect(eventSubDeps(), twitchId);
		},
	};
}

async function handle(request: Request): Promise<Response> {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	let body: unknown;
	if (request.method === "POST")
		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "El cuerpo tiene que ser JSON." }, { status: 400 });
		}
	const r = await handleAccounts(session, { method: request.method, url: request.url, body }, await deps());
	return Response.json(r.body, { status: r.status });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
