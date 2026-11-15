import { describe, expect, it, vi } from "vitest";
import { missingScopesOf, VALIDATE_URL } from "./scopes";

const WANTED = ["moderator:read:followers", "bits:read", "channel:read:goals"];
const deps = (response: () => Response | Promise<Response>, token: string | null = "tok") => {
	const fetch = vi.fn(async () => response());
	return { userToken: async () => token, fetch: fetch as unknown as typeof globalThis.fetch, spy: fetch };
};

// specs/twitch-events, «Conexión del canal»: los permisos, según el token actual.
describe("permisos del token de Twitch", () => {
	it("le falta el de metas: lo dice", async () => {
		const d = deps(() => Response.json({ scopes: ["moderator:read:followers", "bits:read"] }));
		expect(await missingScopesOf(d, WANTED)).toEqual(["channel:read:goals"]);
		expect(d.spy).toHaveBeenCalledWith(
			VALIDATE_URL,
			expect.objectContaining({ headers: { authorization: "OAuth tok" } }),
		);
	});

	it("tras volver a entrar, con todos: nada", async () => {
		const d = deps(() => Response.json({ scopes: [...WANTED, "otro"] }));
		expect(await missingScopesOf(d, WANTED)).toEqual([]);
	});

	it("token rechazado (401), sin token o Twitch caído: no avisa", async () => {
		expect(
			await missingScopesOf(
				deps(() => new Response("no", { status: 401 })),
				WANTED,
			),
		).toEqual([]);
		const noToken = deps(() => Response.json({ scopes: [] }), null);
		expect(await missingScopesOf(noToken, WANTED)).toEqual([]);
		expect(noToken.spy).not.toHaveBeenCalled();
		expect(
			await missingScopesOf(
				deps(() => Promise.reject(new Error("red"))),
				WANTED,
			),
		).toEqual([]);
		expect(
			await missingScopesOf(
				deps(() => Response.json({ otra: 1 })),
				WANTED,
			),
		).toEqual([]);
	});
});
