import { describe, expect, it, vi } from "vitest";
import { memoryStore } from "../storage/memory";
import { twitchUserByLogin } from "./users";

function deps(users: Record<string, unknown>[]) {
	const fetch = vi.fn(async (url: string) => {
		if (url.includes("oauth2/token")) return Response.json({ access_token: "app", expires_in: 3600 });
		return Response.json({ data: users });
	});
	return {
		d: {
			store: memoryStore(),
			clientId: "cid",
			clientSecret: "cs",
			fetch: fetch as unknown as typeof globalThis.fetch,
		},
		fetch,
	};
}

// specs/studio-accounts, «Añadir una cuenta».
describe("buscar una cuenta de Twitch", () => {
	it("con su nombre, su foto y su descripción", async () => {
		const { d, fetch } = deps([
			{
				id: "4242",
				login: "sunara__",
				display_name: "Sunara__",
				description: "Pinto en directo.",
				profile_image_url: "https://static-cdn/x.png",
			},
		]);
		expect(await twitchUserByLogin(d, " @Sunara__ ")).toEqual({
			id: "4242",
			login: "sunara__",
			name: "Sunara__",
			image: "https://static-cdn/x.png",
			description: "Pinto en directo.",
		});
		expect(String(fetch.mock.calls.at(-1)?.[0])).toContain("/users?login=sunara__");
	});

	it("un usuario que no existe: nada", async () => {
		expect(await twitchUserByLogin(deps([]).d, "noexiste")).toBeNull();
	});

	it("un usuario no válido no llega a Twitch", async () => {
		const { d, fetch } = deps([]);
		expect(await twitchUserByLogin(d, "a b")).toBeNull();
		expect(await twitchUserByLogin(d, "ab")).toBeNull();
		expect(fetch).not.toHaveBeenCalled();
	});
});
