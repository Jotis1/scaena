import { describe, expect, it } from "vitest";
import { type ProfileEdits, type ProfileStore, repoProfile } from "../profile";
import { clearProfileEdits, type ProfileEditDeps, saveProfileEdits } from "./profile-edits";

function memory(): ProfileStore & { saved: Map<string, ProfileEdits> } {
	const saved = new Map<string, ProfileEdits>();
	return {
		saved,
		read: async (l) => saved.get(l) ?? null,
		write: async (l, d) => void saved.set(l, d),
		clear: async (l) => void saved.delete(l),
	};
}

function deps(sessionChannelId = "1337"): ProfileEditDeps & { store: ReturnType<typeof memory> } {
	return { sessionChannelId, profileChannelId: async () => "1337", base: repoProfile(), store: memory() };
}

// specs/twitch-profile-assets, «Editar el contenido de los recursos».
describe("cambios del perfil desde Recursos", () => {
	it("guardar una norma nueva", async () => {
		const d = deps();
		const rules = ["Respeto.", "Sin spoilers.", "Nada de spam."];
		const r = await saveProfileEdits(d, { edits: { rules } });
		expect(r.status).toBe(200);
		expect(d.store.saved.get("jotis_1")).toEqual({ rules });
	});

	it("una norma con emoji: 422 con el campo y sin guardar", async () => {
		const d = deps();
		const r = await saveProfileEdits(d, { edits: { rules: ["Hola 🎉"] } });
		expect(r.status).toBe(422);
		expect(r.body).toMatchObject({ fields: { "rules.0": expect.stringMatching(/emoji/) } });
		expect(d.store.saved.size).toBe(0);
	});

	it("el usuario de Twitch no se puede cambiar", async () => {
		const r = await saveProfileEdits(deps(), { edits: { twitch: { login: "otro" } } });
		expect(r.status).toBe(422);
		expect(r.body).toMatchObject({ fields: { twitch: expect.any(String) } });
	});

	it("otra cuenta no puede cambiarlo", async () => {
		const d = deps("999");
		expect((await saveProfileEdits(d, { edits: { tagline: "x" } })).status).toBe(403);
		expect((await clearProfileEdits(d)).status).toBe(403);
	});

	it("volver a los valores por defecto borra lo guardado", async () => {
		const d = deps();
		await saveProfileEdits(d, { edits: { tagline: "Otro lema" } });
		const r = await clearProfileEdits(d);
		expect(r.status).toBe(200);
		expect(d.store.saved.size).toBe(0);
		expect(r.body).toMatchObject({ profile: { tagline: repoProfile().tagline } });
	});
});
