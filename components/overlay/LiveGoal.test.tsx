import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GoalView } from "@/lib/alerts/goal-pick";
import type { GoalState } from "@/lib/alerts/saved-goal";
import { LiveGoal } from "./LiveGoal";

let value: { allowed: boolean; goal: { view: GoalView; offset: number } | null } = {
	allowed: true,
	goal: null,
};
vi.mock("./ChannelEvents", () => ({
	useChannelEvents: () => ({ ...value, phrases: null, subscribe: () => () => {} }),
	useAlertListener: () => {},
}));

const g = (label: string, current: number, target: number): GoalState => ({
	ref: `scaena:${label.toLowerCase().padEnd(8, "x").slice(0, 8)}`,
	source: "scaena",
	type: "subs",
	label,
	current,
	target,
});
const render = () => renderToStaticMarkup(<LiveGoal type="follows" label="De la URL" start={10} goal={50} />);

afterEach(() => {
	vi.useRealTimers();
	value = { allowed: true, goal: null };
});

// specs/obs-overlays, «Qué meta sale», «Rotación de metas» y «Meta editable en el estudio».
describe("pieza de meta", () => {
	it("sin metas guardadas, la de la URL, como hasta ahora", () => {
		expect(render()).toContain("De la URL");
	});

	it("con una meta elegida, esa, aunque la URL diga otra", () => {
		value.goal = { view: { kind: "one", goal: g("Subs", 290, 350) }, offset: 0 };
		const html = render();
		expect(html).toContain("Subs");
		expect(html).not.toContain("De la URL");
		expect(html).toContain('data-goal="scaena:subsxxxx"');
	});

	it("en la rotación, la del turno según el reloj", () => {
		vi.useFakeTimers();
		const view: GoalView = {
			kind: "rotate",
			every: 10,
			goals: [g("Subs", 1, 3), g("Follows", 4, 50)],
			serverNow: 0,
		};
		value.goal = { view, offset: 0 };
		vi.setSystemTime(5_000);
		expect(render()).toContain("Subs");
		vi.setSystemTime(15_000);
		expect(render()).toContain("Follows");
		// Con el reloj local 10 s por detrás del servidor, ya toca la siguiente.
		value.goal = { view, offset: 10_000 };
		vi.setSystemTime(5_000);
		expect(render()).toContain("Follows");
	});

	it("con un token que no vale, nada", () => {
		value = { allowed: false, goal: { view: { kind: "one", goal: g("Subs", 1, 3) }, offset: 0 } };
		expect(render()).toBe("");
	});
});
