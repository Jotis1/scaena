import { afterEach, describe, expect, it, vi } from "vitest";
import { memoryChannelRegistry, setChannelRegistry } from "./studio/channels";

// El principal pasa por Helix; aquí se prueban los canales añadidos, que no le preguntan a nadie.
vi.mock("./twitch/server", () => ({ helixDeps: () => ({}) }));
vi.mock("./twitch/users", () => ({ channelIdFromLogin: vi.fn(async () => "1337") }));
const { channelIdOf, profileOf } = await import("./channel");

const SUNARA = {
	twitchId: "4242",
	login: "sunara__",
	name: "Sunara",
	image: null,
	description: "",
	addedBy: "1337",
};

afterEach(() => setChannelRegistry(undefined));

// design.md del cambio multi-channel-studio, decisión 6.
describe("id y perfil de un canal por su login", () => {
	it("un canal añadido: su id sale de «Cuentas», sin preguntar a Twitch", async () => {
		setChannelRegistry(memoryChannelRegistry([SUNARA]));
		expect(await channelIdOf("Sunara__")).toBe("4242");
		expect((await profileOf("sunara__"))?.name).toBe("Sunara");
	});

	it("el principal, por Helix si aún no tiene fila", async () => {
		setChannelRegistry(memoryChannelRegistry());
		expect(await channelIdOf("jotis_1")).toBe("1337");
	});

	it("un login que no es de ningún canal: ni id ni perfil", async () => {
		setChannelRegistry(memoryChannelRegistry([SUNARA]));
		expect(await channelIdOf("otrocanal")).toBeNull();
		expect(await profileOf("otrocanal")).toBeNull();
	});
});
