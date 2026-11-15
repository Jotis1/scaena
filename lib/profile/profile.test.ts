import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { PROFILE_ICONS } from "../icons";
import { memoryChannelRegistry, setChannelRegistry } from "../studio/channels";
import {
	baseProfileOf,
	findProfile,
	loadProfile,
	loadProfileWithIssues,
	mergeProfile,
	PROFILE_PATH,
	ProfileEditsError,
	ProfileError,
	parseProfile,
	repoProfile,
	setProfileStore,
	validateEdits,
} from ".";

const REAL_YAML = readFileSync(PROFILE_PATH, "utf8");

/** El perfil real con un cambio, para probar cada error sin escribir un perfil entero. */
// biome-ignore lint/suspicious/noExplicitAny: el test estropea el YAML a propósito, campo a campo.
function withChange(change: (p: any) => void): string {
	const p = parse(REAL_YAML);
	change(p);
	return stringify(p);
}

function problems(yaml: string): string[] {
	try {
		parseProfile(yaml);
	} catch (e) {
		if (e instanceof ProfileError) return e.problems;
		throw e;
	}
	return [];
}

describe("perfil del canal", () => {
	it("el perfil del repositorio es válido", () => {
		const p = parseProfile(REAL_YAML);
		expect(p.twitch.login).toBe("jotis_1");
		expect(p.scenes.offline.title).toBe("Ahora no estoy");
	});

	it("nombra el campo que falta", () => {
		expect(problems(withChange((p) => delete p.twitch.login))).toEqual([
			expect.stringMatching(/^twitch\.login: /),
		]);
	});

	it("señala la franja con una hora mal escrita", () => {
		expect(problems(withChange((p) => (p.schedule.start = "25:00")))).toEqual([
			"schedule.start: hora en formato HH:mm, de 00:00 a 23:59",
		]);
	});

	it("rechaza un titular de escena de más de 24 caracteres", () => {
		const long = "Empezamos dentro de nada";
		expect(long.length).toBe(24);
		expect(problems(withChange((p) => (p.scenes.starting.title = long)))).toEqual([]);
		expect(problems(withChange((p) => (p.scenes.starting.title = `${long} ya`)))).toEqual([
			"scenes.starting.title: como mucho 24 caracteres (guía de Regula)",
		]);
	});

	it("rechaza emojis y señala el panel por su nombre", () => {
		const yaml = withChange((p) => {
			const schedule = p.panels.find((x: { slug: string }) => x.slug === "horario");
			schedule.paragraphs[0] = "Lo habitual 🎮";
		});
		expect(problems(yaml)).toEqual([
			"panels[1] («horario»).paragraphs[0]: sin emojis: la guía de Regula no los admite",
		]);
	});

	it("rechaza un icono fuera de la lista del perfil", () => {
		expect(problems(withChange((p) => (p.panels[0].icon = "no-existe" as never)))).toEqual([
			"panels[0] («de-que-va»).icon: no es un icono del perfil; se pueden usar clock, info-circle, link-01, play, shield-tick",
		]);
	});

	it("traduce cada icono del perfil a un componente", () => {
		for (const panel of parseProfile(REAL_YAML).panels) expect(PROFILE_ICONS[panel.icon]).toBeDefined();
	});

	it("exige los cuatro pasos de «Cómo va un directo» y nombra el que falta", () => {
		expect(problems(withChange((p) => delete p.journey.chatting))).toEqual([
			"journey.chatting: Invalid input: expected object, received undefined",
		]);
	});

	it("rechaza emojis en un paso de la portada y señala ese paso", () => {
		expect(problems(withChange((p) => (p.journey.after.text += " 🎮")))).toEqual([
			"journey.after.text: sin emojis: la guía de Regula no los admite",
		]);
	});

	it("rechaza emojis en la frase de la web y en el pie", () => {
		expect(
			problems(
				withChange((p) => {
					p.site.intro += " 👋";
					p.site.footer += " ✨";
				}),
			),
		).toEqual([
			"site.intro: sin emojis: la guía de Regula no los admite",
			"site.footer: sin emojis: la guía de Regula no los admite",
		]);
	});

	it("rechaza huecos desconocidos en las frases de alerta", () => {
		expect(problems(withChange((p) => (p.alerts.resub = "Hola, {nombre}.")))).toEqual([
			"alerts.resub: hueco «{nombre}» no válido; se pueden usar {meses}, {cantidad}, {espectadores}, {bits}",
		]);
	});

	it("un panel lleva párrafos propios o los saca de otra parte, no las dos cosas", () => {
		expect(problems(withChange((p) => (p.panels[0].paragraphs = ["Otro texto."])))).toEqual([
			"panels[0] («de-que-va»).paragraphs: pon `paragraphs` o `from`, uno de los dos",
		]);
	});

	it("no admite slugs ni redes repetidos", () => {
		expect(problems(withChange((p) => (p.panels[1].slug = "de-que-va")))).toContain(
			"panels[1] («de-que-va»).slug: slug repetido: «de-que-va»",
		);
		expect(
			problems(withChange((p) => p.socials.push({ network: "twitch", text: "Otra vez" }))),
		).toContain("socials[3].network: red repetida: «twitch»");
	});

	it("una red puede ir sin enlace", () => {
		const discord = parseProfile(REAL_YAML).socials.find((r) => r.network === "discord");
		expect(discord?.url).toBeUndefined();
	});

	it("YAML mal formado", () => {
		expect(problems("name: [sin cerrar")[0]).toMatch(/^YAML mal formado/);
	});
});

// design.md del cambio multi-channel-studio, decisión 3.
describe("perfil base de cada canal", () => {
	afterEach(() => setChannelRegistry(undefined));
	const SUNARA = {
		twitchId: "4242",
		login: "sunara__",
		name: "Sunara",
		image: null,
		description: "Pinto y juego.",
		addedBy: "1",
	};

	it("el principal, del repositorio, con cualquier mayúscula", async () => {
		setChannelRegistry(memoryChannelRegistry());
		expect((await baseProfileOf("jotis_1"))?.name).toBe("Jotis");
		expect((await baseProfileOf("Jotis_1"))?.name).toBe("Jotis");
	});

	it("uno añadido, el que sale de su Twitch; uno desconocido, ninguno", async () => {
		setChannelRegistry(memoryChannelRegistry([SUNARA]));
		expect(await baseProfileOf("sunara__")).toMatchObject({
			name: "Sunara",
			tagline: "Pinto y juego.",
			rules: [],
		});
		expect(await baseProfileOf("otrocanal")).toBeNull();
	});

	it("`findProfile` de un canal desconocido es `null`", async () => {
		setChannelRegistry(memoryChannelRegistry());
		setProfileStore({ read: async () => null, write: async () => {}, clear: async () => {} });
		expect(await findProfile("otrocanal")).toBeNull();
		setProfileStore(undefined);
	});
});

// specs/channel-profile, «Contenido del canal en un solo sitio» y «Cambios del perfil validados».
describe("cambios del estudio sobre el perfil", () => {
	const base = repoProfile();
	const rules = ["Respeto.", "Sin spoilers.", "Nada de spam."];

	it("sin nada guardado, sale el del repositorio", () => {
		expect(mergeProfile(base, null)).toEqual({ profile: base, invalidFields: [] });
	});

	it("lo guardado va encima y lo que no es editable se ignora", () => {
		const { profile, invalidFields } = mergeProfile(base, {
			rules,
			name: "Otro",
			twitch: { login: "otro" },
		});
		expect(profile.rules).toEqual(rules);
		expect(profile.name).toBe(base.name);
		expect(profile.twitch.login).toBe(base.twitch.login);
		expect(invalidFields).toEqual([]);
	});

	it("un campo guardado que ya no vale vuelve al del repositorio", () => {
		const { profile, invalidFields } = mergeProfile(base, {
			rules: ["1", "2", "3", "4", "5", "6"],
			tagline: "Lema nuevo",
		});
		expect(profile.rules).toEqual(base.rules);
		expect(profile.tagline).toBe("Lema nuevo");
		expect(invalidFields).toEqual(["rules"]);
	});

	it("validar unos cambios: emoji en una norma, con su ruta", () => {
		const error = (() => {
			try {
				validateEdits(base, { rules: ["Bien", "Mal 🎉"] });
			} catch (e) {
				return e;
			}
		})();
		expect(error).toBeInstanceOf(ProfileEditsError);
		expect((error as ProfileEditsError).fields["rules.1"]).toMatch(/emoji/);
	});

	it("el usuario de Twitch no se cambia desde el estudio", () => {
		expect(() => validateEdits(base, { twitch: { login: "otro" } })).toThrow(ProfileEditsError);
	});

	it("validar devuelve solo los campos cambiados, ya limpios", () => {
		const { edits, profile } = validateEdits(base, { tagline: "  Lema nuevo  " });
		expect(edits).toEqual({ tagline: "Lema nuevo" });
		expect(profile.tagline).toBe("Lema nuevo");
	});

	it("loadProfile lee del almacén y sigue sin él", async () => {
		setProfileStore({ read: async () => ({ rules }), write: async () => {}, clear: async () => {} });
		expect((await loadProfile("jotis_1")).rules).toEqual(rules);
		setProfileStore({
			read: async () => {
				throw new Error("sin base de datos");
			},
			write: async () => {},
			clear: async () => {},
		});
		expect((await loadProfileWithIssues("jotis_1")).profile.rules).toEqual(base.rules);
		setProfileStore(undefined);
	});
});
