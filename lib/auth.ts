// Autenticación del estudio con better-auth, Prisma y Twitch (design.md, decisiones 1b y 9).
// Se crea la primera vez que hace falta: así `next build` no necesita secretos ni base de datos.
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { env } from "./env";
import { type ChannelRegistry, channelRegistry } from "./studio/channels";

/** Permisos de solo lectura para recibir follows, suscripciones y bits por EventSub. */
export const TWITCH_SCOPES = [
	"moderator:read:followers",
	"channel:read:subscriptions",
	"bits:read",
	"channel:read:goals",
];

/** Código de error con el que vuelve a `/studio/login` una cuenta que no puede entrar. */
export const ERROR_NOT_ALLOWED = "account_not_allowed";

const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

export interface AuthOptions {
	baseURL: string;
	secret: string;
	clientId: string;
	clientSecret: string;
	/** Administradores: los ids de Twitch de la configuración, que entran siempre (specs/studio-accounts). */
	allowedIds: readonly string[];
	/** Las cuentas añadidas desde «Cuentas»; por defecto, las de Postgres. Los tests pasan una en memoria. */
	registry?: () => Promise<ChannelRegistry>;
	/** Base de datos de better-auth; en producción, Prisma. Los tests pasan la de memoria. */
	database: Parameters<typeof betterAuth>[0]["database"];
}

export function createAuth(o: AuthOptions) {
	return betterAuth({
		baseURL: o.baseURL,
		secret: o.secret,
		database: o.database,
		socialProviders: {
			twitch: {
				clientId: o.clientId,
				clientSecret: o.clientSecret,
				scope: TWITCH_SCOPES,
				// Se ejecuta en cada entrada, antes de crear o actualizar nada: una cuenta que no es administradora ni
				// está en «Cuentas» no llega a tener usuario ni sesión, y una que se quita deja de poder entrar
				// (design.md del cambio multi-channel-studio, decisión 2). Al entrar, su fila se pone al día.
				mapProfileToUser: async (profile) => {
					const id = String(profile.sub);
					const login = String(profile.preferred_username ?? "");
					const registry = await (o.registry ?? channelRegistry)();
					const admin = o.allowedIds.includes(id);
					if (!admin && !(await registry.byId(id))) {
						// Los ids de Twitch son públicos: dejarlos en el registro permite ver al momento quién intentó entrar.
						console.warn(
							`Estudio: cuenta de Twitch rechazada, ${login} (${id}). Administradores: ${o.allowedIds.join(", ") || "(ninguno)"}.`,
						);
						throw new APIError("FORBIDDEN", { message: `${ERROR_NOT_ALLOWED}|${login}|${id}` });
					}
					try {
						await registry.upsertSignIn({
							twitchId: id,
							login,
							name: String(profile.preferred_username ?? login),
							image: typeof profile.picture === "string" ? profile.picture : null,
						});
					} catch (e) {
						// Que no poner al día la fila no deje sin entrar: se reintenta en la siguiente entrada.
						console.error("Estudio: no se ha podido poner al día la cuenta:", e);
					}
					return {};
				},
			},
		},
		session: { expiresIn: THIRTY_DAYS_SEC },
		// Las cookies de sesión que ponen las Server Actions llegan al navegador.
		plugins: [nextCookies()],
	});
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Manejador de `/api/auth/*`. better-auth contesta un 403 en JSON cuando `mapProfileToUser` rechaza la cuenta;
 * en el navegador eso sería un JSON pelado, así que se convierte en una vuelta a la entrada del estudio con el
 * aviso de cuenta sin acceso (diseño: «Esta cuenta no tiene acceso»).
 */
export async function handleAuth(a: Auth, request: Request): Promise<Response> {
	const res = await a.handler(request);
	if (res.status !== 403 || !new URL(request.url).pathname.includes("/callback/")) return res;
	const body = await res.clone().text();
	const match = new RegExp(`${ERROR_NOT_ALLOWED}\\|([^|"]*)\\|(\\d+)`).exec(body);
	if (!match) return res;
	// La cuenta con la que se ha entrado sale en el aviso (diseño: «Has entrado como …»).
	const q = new URLSearchParams({ error: ERROR_NOT_ALLOWED, account: match[1] ?? "", id: match[2] ?? "" });
	const headers = new Headers({ location: `/studio/login?${q}` });
	for (const c of res.headers.getSetCookie()) headers.append("set-cookie", c);
	return new Response(null, { status: 302, headers });
}

let instance: Auth | undefined;

export function auth(): Auth {
	if (!instance) {
		const e = env();
		instance = createAuth({
			baseURL: e.BETTER_AUTH_URL,
			secret: e.BETTER_AUTH_SECRET,
			clientId: e.TWITCH_CLIENT_ID,
			clientSecret: e.TWITCH_CLIENT_SECRET,
			allowedIds: e.STUDIO_ALLOWED_TWITCH_IDS,
			database: prismaAdapter(db(), { provider: "postgresql" }),
		});
	}
	return instance;
}
