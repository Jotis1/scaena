import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_PATH, parseProfile } from "../profile";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { fillPhrase } from "./phrase";
import { effectivePhrases, readSettings, SettingsError, saveSettings } from "./settings";

const profile = parseProfile(readFileSync(PROFILE_PATH, "utf8"));
const CHANNEL = "1337";

describe("frases de alerta", () => {
	it("renovación de 14 meses → «14 meses ya. Gracias por seguir aquí.»", () => {
		expect(fillPhrase("{meses} meses ya. Gracias por seguir aquí.", { type: "resub", months: 14 })).toBe(
			"14 meses ya. Gracias por seguir aquí.",
		);
	});

	it("las cifras salen en formato español", () => {
		expect(fillPhrase("Llega con {espectadores} personas.", { type: "raid", amount: 1284 })).toBe(
			"Llega con 1.284 personas.",
		);
		expect(fillPhrase("{bits} bits.", { type: "bits", amount: 500 })).toBe("500 bits.");
		expect(fillPhrase("Ha regalado {cantidad} subs.", { type: "gift", amount: 5 })).toBe(
			"Ha regalado 5 subs.",
		);
	});

	it("`<b>` queda literal", () => {
		expect(fillPhrase("<b>hola</b>", { type: "follow" })).toBe("<b>hola</b>");
	});

	it("sin ajustes guardados, se usa la frase del perfil", async () => {
		const store = memoryStore();
		expect(effectivePhrases(profile, await readSettings(store, CHANNEL))).toEqual(profile.alerts);
	});

	it("`{nombre}` se rechaza con un mensaje que lista los huecos", async () => {
		const store = memoryStore();
		const error = await saveSettings(store, CHANNEL, profile, {
			alerts: { follow: "Hola, {nombre}." },
		}).catch((e) => e);
		expect(error).toBeInstanceOf(SettingsError);
		expect(error.fields.follow).toMatch(
			/\{nombre\}.*\{meses\}, \{cantidad\}, \{espectadores\}, \{bits\}/,
		);
		expect(await store.get(keys.channel(CHANNEL, "settings"))).toBeNull();
	});

	it("más de 120 caracteres no se guarda", async () => {
		const error = await saveSettings(memoryStore(), CHANNEL, profile, {
			alerts: { raid: "a".repeat(121) },
		}).catch((e) => e);
		expect(error.fields.raid).toMatch(/120/);
	});

	it("guardar avisa por el flujo con las frases resultantes", async () => {
		const store = memoryStore();
		await saveSettings(store, CHANNEL, profile, { alerts: { raid: "Llegan {espectadores}." } });
		const [entry] = await store.xrange(keys.channel(CHANNEL, "events"));
		expect(entry?.fields.type).toBe("settings");
		const { alerts } = JSON.parse(entry?.fields.data ?? "{}");
		expect(alerts.raid).toBe("Llegan {espectadores}.");
		expect(alerts.follow).toBe(profile.alerts.follow);
		expect((await readSettings(store, CHANNEL)).alerts).toEqual({ raid: "Llegan {espectadores}." });
	});

	it("una frase vacía vuelve a la del perfil", async () => {
		const store = memoryStore();
		await saveSettings(store, CHANNEL, profile, { alerts: { raid: "Llegan {espectadores}." } });
		await saveSettings(store, CHANNEL, profile, { alerts: { raid: "  " } });
		expect((await readSettings(store, CHANNEL)).alerts).toEqual({});
	});
});
