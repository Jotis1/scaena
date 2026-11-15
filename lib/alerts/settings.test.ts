import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_PATH, parseProfile } from "../profile";
import { keys } from "../redis/keys";
import { memoryStore } from "../storage/memory";
import { ALERT_TYPES } from "../twitch/eventsub/event";
import { fillPhrase, phraseError } from "./phrase";
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

	it("`{nombre}` se rechaza con un mensaje que dice qué huecos valen en esa alerta", async () => {
		const store = memoryStore();
		const error = await saveSettings(store, CHANNEL, profile, {
			alerts: { follow: "Hola, {nombre}.", raid: "Llegan {nombre}." },
		}).catch((e) => e);
		expect(error).toBeInstanceOf(SettingsError);
		expect(error.fields.follow).toBe("El hueco {nombre} no vale aquí. Esta alerta no tiene huecos.");
		expect(error.fields.raid).toBe(
			"El hueco {nombre} no vale aquí. En esta alerta solo se rellena {espectadores}.",
		);
		expect(await store.get(keys.channel(CHANNEL, "settings"))).toBeNull();
	});

	// specs/obs-overlays, «Frases de alerta editables»: cada frase, con los huecos de su tipo.
	it("hueco de otra alerta: bits con {bit} y follow con {meses} no se guardan", async () => {
		const store = memoryStore();
		const error = await saveSettings(store, CHANNEL, profile, {
			alerts: { bits: "{bit} bits.", follow: "{meses} meses siguiendo." },
		}).catch((e) => e);
		expect(error.fields.bits).toBe("El hueco {bit} no vale aquí. En esta alerta solo se rellena {bits}.");
		expect(error.fields.follow).toMatch(/{meses} no vale aquí. Esta alerta no tiene huecos/);
		expect(await store.get(keys.channel(CHANNEL, "settings"))).toBeNull();
	});

	it("una frase guardada antes, con un hueco de otra alerta, se sigue leyendo", async () => {
		const store = memoryStore();
		await store.set(keys.channel(CHANNEL, "settings"), {
			alerts: { follow: "{meses} meses siguiendo." },
		});
		expect((await readSettings(store, CHANNEL)).alerts.follow).toBe("{meses} meses siguiendo.");
		expect(phraseError("follow", "{meses} meses siguiendo.")).toMatch(/no tiene huecos/);
	});

	it("las frases del perfil del canal cumplen los huecos de su tipo", () => {
		for (const t of ALERT_TYPES) expect(phraseError(t, profile.alerts[t]), t).toBeNull();
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
