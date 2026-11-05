import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_PATH, parseProfile } from "../profile";
import { bannerOf, panelsOf } from "./panels";

const profile = parseProfile(readFileSync(PROFILE_PATH, "utf8"));

describe("paneles del perfil", () => {
	it("uno por entrada del perfil, con su nombre de archivo", () => {
		expect(panelsOf(profile).map((p) => p.file)).toEqual(
			profile.panels.map((p) => `panel-${p.slug}.png`),
		);
	});

	it("«Normas» con sus tres filas numeradas, sacadas de `rules`", () => {
		const normas = panelsOf(profile).find((p) => p.slug === "normas");
		expect(normas?.title).toBe("Normas");
		expect(normas?.paragraphs).toEqual(profile.rules.map((r, i) => `${i + 1}. ${r}`));
		expect(normas?.paragraphs).toHaveLength(3);
	});

	it("«Vídeos» lleva la acción con la URL de YouTube", () => {
		const videos = panelsOf(profile).find((p) => p.slug === "videos");
		expect(videos?.action).toEqual({ label: "Ver en YouTube", href: "https://www.youtube.com/@jotis_1" });
		expect(videos?.noLinkReason).toBeUndefined();
	});

	it("«Horario» con las filas de la franja; «Redes» sin Discord mientras no tenga enlace", () => {
		const panels = panelsOf(profile);
		expect(panels.find((p) => p.slug === "horario")?.rows).toEqual([
			{ label: "Normalmente", value: "17:00 – 20:00" },
			{ label: "Días", value: "Sin fijar" },
		]);
		expect(panels.find((p) => p.slug === "redes")?.rows).toEqual([
			{ label: "YouTube", value: "@jotis_1" },
		]);
	});

	it("el banner: nombre, lema y «Suele ser 17-20 h» / «Días: Sin fijar»", () => {
		expect(bannerOf(profile)).toEqual({
			name: "jotis_1",
			tagline: "Juegos a mi ritmo, sin prisa.",
			eyebrow: "Juegos y Just Chatting en Twitch",
			schedule: [
				{ day: "Suele ser", time: "17-20 h" },
				{ day: "Días", time: "Sin fijar" },
			],
			file: "banner.png",
		});
	});
});
