import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { saveGoal } from "../alerts/saved-goal";
import { PROFILE_PATH, parseProfile } from "../profile";
import { memoryStore } from "../storage/memory";
import { initialEvents } from "./initial";

const profile = parseProfile(readFileSync(PROFILE_PATH, "utf8"));

describe("al conectar", () => {
	it("sin meta guardada, solo las frases", async () => {
		const events = await initialEvents(memoryStore(), "1337", profile);
		expect(events.map((e) => e.event)).toEqual(["settings"]);
	});

	it("con meta guardada, las frases y la meta con la cuenta al día", async () => {
		const s = memoryStore();
		await saveGoal(s, "1337", {
			goal: { type: "follows", label: "Seguidores", target: 50 },
			current: 43,
		});
		const [settings, goal] = await initialEvents(s, "1337", profile);
		expect(settings?.event).toBe("settings");
		expect(goal?.event).toBe("goal");
		expect(JSON.parse(goal?.data ?? "{}")).toEqual({
			type: "follows",
			label: "Seguidores",
			target: 50,
			current: 43,
		});
	});
});
