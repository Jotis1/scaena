// Permisos que tiene de verdad el token de Twitch de la sesión (specs/twitch-events, «Conexión del canal»; design.md
// del cambio studio-polish-0-4-1, decisión 5). No vale la lista que guarda better-auth en la cuenta: al volver a
// entrar con Twitch renueva el token pero deja esa lista como estaba (solo la cambia `linkSocial`), así que un permiso
// dado después seguiría pareciendo que falta. Se pregunta a Twitch con el token actual.
// https://dev.twitch.tv/docs/authentication/validate-tokens/

export const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";

export interface ScopeCheckDeps {
	/** El token de usuario actual; `null` si no hay. */
	userToken: () => Promise<string | null>;
	fetch?: typeof fetch;
	timeoutMs?: number;
}

/**
 * Los permisos de `wanted` que le faltan al token, según Twitch. Ante cualquier duda (sin token, token rechazado,
 * error de red o sin respuesta a tiempo) devuelve `[]`: mejor no avisar que avisar sin estar seguros.
 */
export async function missingScopesOf(d: ScopeCheckDeps, wanted: readonly string[]): Promise<string[]> {
	try {
		const token = await d.userToken();
		if (!token) return [];
		const res = await (d.fetch ?? fetch)(VALIDATE_URL, {
			headers: { authorization: `OAuth ${token}` },
			signal: AbortSignal.timeout(d.timeoutMs ?? 2000),
		});
		if (!res.ok) return [];
		const { scopes } = (await res.json()) as { scopes?: unknown };
		if (!Array.isArray(scopes)) return [];
		return wanted.filter((s) => !scopes.includes(s));
	} catch (e) {
		console.warn(
			`Permisos de Twitch: no se han podido comprobar (${e instanceof Error ? e.message : e}).`,
		);
		return [];
	}
}
