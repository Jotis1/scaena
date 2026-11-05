import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { getProfile, PROFILE_PATH, ProfileError, parseProfile } from ".";

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

	it("rechaza un icono que no está en Regula", () => {
		expect(problems(withChange((p) => (p.panels[0].icon = "cohete")))).toEqual([
			"panels[0] («de-que-va»).icon: no es un icono de Regula",
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

describe("getProfile", () => {
	it("devuelve el perfil del canal configurado", () => {
		expect(getProfile("jotis_1").name).toBe("Jotis");
		expect(getProfile("Jotis_1").name).toBe("Jotis");
	});

	it("falla con otro canal", () => {
		expect(() => getProfile("otrocanal")).toThrow("No hay perfil para el canal «otrocanal»");
	});
});
