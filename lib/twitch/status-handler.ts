// `GET /api/status[?channel=<login>]` (design.md, decisión 6). Sin canal, el de la web. La CDN lo guarda 30 s,
// así que la web y los overlays que lo sondean cada 30 s no llegan casi nunca a Twitch.
import type { LiveStatus } from "./status";

export const STATUS_CACHE = "public, s-maxage=30";

export interface StatusDeps {
	defaultLogin: string;
	/** Estado del canal o `null` si el login no es de Scaena. */
	status: (login: string) => Promise<LiveStatus | null>;
}

export async function handleStatus(request: Request, d: StatusDeps): Promise<Response> {
	const login = new URL(request.url).searchParams.get("channel")?.trim().toLowerCase() || d.defaultLogin;
	const s = await d.status(login);
	if (!s)
		return Response.json(
			{ error: `No hay ningún canal «${login}» en Scaena.` },
			{ status: 404, headers: { "cache-control": "no-store" } },
		);
	return Response.json(s, { headers: { "cache-control": STATUS_CACHE } });
}
