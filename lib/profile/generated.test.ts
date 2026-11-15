import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { panelsOf } from "../studio/panels";
import { PROFILE_PATH, ProfileError, parseProfile } from ".";
import { generatedProfile } from "./generated";
import { profileSchema } from "./schema";

const row = { login: "Sunara__", name: "Sunara", description: "" };

// specs/channel-profile, «Perfil de un canal añadido».
describe("perfil de un canal añadido", () => {
	it("con descripción en Twitch: el lema y la descripción salen de ella, sin emojis", () => {
		const p = generatedProfile({ ...row, description: "Pinto en directo 🎨. A veces juego! Y charlo." });
		expect(p.tagline).toBe("Pinto en directo.");
		expect(p.description).toEqual(["Pinto en directo.", "A veces juego!", "Y charlo."]);
	});

	it("sin descripción: una frase con su nombre", () => {
		const p = generatedProfile(row);
		expect(p.tagline).toBe("Canal de Sunara en Twitch.");
		expect(p.description).toEqual(["Canal de Sunara en Twitch."]);
	});

	it("Twitch como única red; normas, qué se emite y días, vacíos; sin YouTube", () => {
		const p = generatedProfile(row);
		expect(p.twitch.login).toBe("sunara__");
		expect(p.socials).toEqual([
			{ network: "twitch", text: "El directo, cuando lo hay.", url: "https://twitch.tv/sunara__" },
		]);
		expect([p.rules, p.streams]).toEqual([[], []]);
		expect(p.schedule.days).toBeUndefined();
		expect(p.youtube).toBeUndefined();
		expect(p.camera.name).toBe("Sunara");
		expect(profileSchema.safeParse(p).success).toBe(true);
	});

	it("paneles de sus datos: al empezar salen «De qué va» y «Horario»; «Normas» y «Redes», cuando hay qué poner", () => {
		const p = generatedProfile({ ...row, description: "Pinto en directo." });
		expect(p.panels.map((x) => x.title)).toEqual(["De qué va", "Horario", "Normas", "Redes"]);
		expect(panelsOf(p).map((x) => x.title)).toEqual(["De qué va", "Horario"]);
		const filled = {
			...p,
			rules: ["Respeto."],
			socials: [
				...p.socials,
				{ network: "discord" as const, text: "Charla.", url: "https://discord.gg/x" },
			],
		};
		expect(panelsOf(filled).map((x) => x.title)).toEqual(["De qué va", "Horario", "Normas", "Redes"]);
	});

	it("una descripción larga se queda en cuatro frases", () => {
		const p = generatedProfile({ ...row, description: "Uno. Dos. Tres. Cuatro. Cinco. Seis." });
		expect(p.description).toHaveLength(4);
	});
});

// specs/channel-profile, «El principal sigue exigiéndolo todo».
describe("el perfil del repositorio lo exige todo", () => {
	const yaml = parse(readFileSync(PROFILE_PATH, "utf8"));

	it("sin YouTube no vale, y lo dice", () => {
		const { youtube: _, ...rest } = yaml;
		const e = (() => {
			try {
				parseProfile(stringify(rest));
			} catch (err) {
				return err;
			}
		})();
		expect(e).toBeInstanceOf(ProfileError);
		expect(String((e as ProfileError).message)).toMatch(/youtube/);
	});

	it("sin normas ni paneles no vale", () => {
		expect(() => parseProfile(stringify({ ...yaml, rules: [] }))).toThrow(ProfileError);
		expect(() => parseProfile(stringify({ ...yaml, panels: [] }))).toThrow(ProfileError);
	});
});
