import { createHmac, randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import pg from "pg";
import { CHANNEL_ID } from "./redis";

// Sesión de better-auth de verdad para los tests del estudio: usuario, cuenta de Twitch y sesión en Postgres, y la
// cookie firmada como la firma better-auth (`token.firma`, HMAC-SHA256 en base64). Sin pasar por Twitch.

export const E2E_DATABASE_URL =
	process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:54329/postgres";
export const E2E_AUTH_SECRET = "secreto-de-pruebas-e2e-de-32-caracteres";
export const SESSION_COOKIE = "better-auth.session_token";

export function signCookie(token: string, secret = E2E_AUTH_SECRET): string {
	const signature = createHmac("sha256", secret).update(token).digest("base64");
	return encodeURIComponent(`${token}.${signature}`);
}

export interface StudioUser {
	userId: string;
	token: string;
	cookie: string;
	remove(): Promise<void>;
}

/** Crea a jotis_1 (id de Twitch `CHANNEL_ID`) con una sesión de 30 días. Cada test, el suyo. */
export async function createStudioUser(name = "jotis_1"): Promise<StudioUser> {
	const db = new pg.Client({ connectionString: E2E_DATABASE_URL });
	await db.connect();
	const userId = `e2e-${randomUUID()}`;
	const token = randomUUID().replaceAll("-", "");
	const now = new Date();
	const expires = new Date(now.getTime() + 30 * 86_400_000);
	try {
		await db.query(
			'insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)',
			[userId, name, `${userId}@e2e.scaena`, now],
		);
		await db.query(
			'insert into account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $5)',
			[`${userId}-acc`, CHANNEL_ID, "twitch", userId, now],
		);
		await db.query(
			'insert into session (id, token, "userId", "expiresAt", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $5)',
			[`${userId}-ses`, token, userId, expires, now],
		);
	} finally {
		await db.end();
	}
	return {
		userId,
		token,
		cookie: signCookie(token),
		async remove() {
			const c = new pg.Client({ connectionString: E2E_DATABASE_URL });
			await c.connect();
			await c.query('delete from "user" where id = $1', [userId]);
			await c.end();
		},
	};
}

export async function signInAs(context: BrowserContext, user: StudioUser, baseURL: string): Promise<void> {
	await context.addCookies([
		{ name: SESSION_COOKIE, value: user.cookie, url: baseURL, httpOnly: true, sameSite: "Lax" },
	]);
}
