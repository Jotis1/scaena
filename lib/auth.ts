// Autenticación del estudio con better-auth, Prisma y Twitch (design.md, decisiones 1b y 9).
// Se crea la primera vez que hace falta: así `next build` no necesita secretos ni base de datos.
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { env } from "./env";

/** Permisos de solo lectura para recibir follows, suscripciones y bits por EventSub. */
export const TWITCH_SCOPES = ["moderator:read:followers", "channel:read:subscriptions", "bits:read"];

/** Código de error con el que vuelve a `/studio/login` una cuenta que no puede entrar. */
export const ERROR_NOT_ALLOWED = "account_not_allowed";

const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

export interface AuthOptions {
	baseURL: string;
	secret: string;
	clientId: string;
	clientSecret: string;
	/** Ids de Twitch que pueden entrar en el estudio (hoy, el de jotis_1). */
	allowedIds: readonly string[];
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
				// Se ejecuta en cada entrada, antes de crear o actualizar nada: una cuenta que no está en la lista
				// no llega a tener usuario ni sesión, y una que se quita de la lista deja de poder entrar.
				mapProfileToUser: (profile) => {
					const id = String(profile.sub);
					if (!o.allowedIds.includes(id)) {
						const login = String(profile.preferred_username ?? "");
						// Los ids de Twitch son públicos: dejarlos en el registro permite ver al momento si la lista de
						// permitidos (STUDIO_ALLOWED_TWITCH_IDS) no es la que se esperaba.
						console.warn(
							`Estudio: cuenta de Twitch rechazada, ${login} (${id}). Permitidos: ${o.allowedIds.join(", ") || "(ninguno)"}.`,
						);
						throw new APIError("FORBIDDEN", { message: `${ERROR_NOT_ALLOWED}|${login}|${id}` });
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
