import { describe, expect, it, vi } from "vitest";
import { addAccount, handleAccounts, listAccounts, lookupAccount, removeAccount } from "./accounts";
import { memoryChannelRegistry } from "./channels";

const ADMIN = "1337";
const SUNARA = {
	id: "4242",
	login: "sunara__",
	name: "Sunara__",
	image: "https://x/s.png",
	description: "Pinto en directo.",
};

function deps() {
	const registry = memoryChannelRegistry([
		{ twitchId: ADMIN, login: "jotis_1", name: "Jotis", image: null, description: "", addedBy: null },
	]);
	return {
		registry,
		adminIds: [ADMIN],
		findUser: vi.fn(async (login: string) => (login.toLowerCase() === "sunara__" ? SUNARA : null)),
		endSessions: vi.fn(async () => {}),
		unsubscribe: vi.fn(async () => {}),
	};
}

// specs/studio-accounts.
describe("cuentas del estudio", () => {
	it("buscar enseña la cuenta y si ya tiene acceso; una que no existe da 404", async () => {
		const d = deps();
		expect(await lookupAccount(d, "sunara__")).toEqual({
			status: 200,
			body: { user: SUNARA, already: false },
		});
		expect((await lookupAccount(d, "noexiste")).status).toBe(404);
	});

	it("añadir a sunara__: queda en la lista, con quién la añadió", async () => {
		const d = deps();
		const r = await addAccount(d, ADMIN, "Sunara__");
		expect(r.status).toBe(200);
		const list = await listAccounts(d);
		expect(list.map((a) => [a.login, a.admin, a.addedByName])).toEqual([
			["jotis_1", true, null],
			["sunara__", false, "Jotis"],
		]);
		expect(await d.registry.byId("4242")).toMatchObject({
			description: "Pinto en directo.",
			addedBy: ADMIN,
		});
	});

	it("añadir una que ya está, o un administrador, da 409 sin repetirla", async () => {
		const d = deps();
		await addAccount(d, ADMIN, "sunara__");
		expect((await addAccount(d, ADMIN, "sunara__")).status).toBe(409);
		d.findUser.mockResolvedValueOnce({ ...SUNARA, id: ADMIN, login: "jotis_1" });
		expect((await addAccount(d, ADMIN, "jotis_1")).status).toBe(409);
		expect(await d.registry.list()).toHaveLength(2);
	});

	it("una que no existe en Twitch no se añade", async () => {
		const d = deps();
		expect((await addAccount(d, ADMIN, "noexiste")).status).toBe(404);
		expect(await d.registry.list()).toHaveLength(1);
	});

	it("quitar: cierra sus sesiones, da de baja sus eventos y borra la fila", async () => {
		const d = deps();
		await addAccount(d, ADMIN, "sunara__");
		const r = await removeAccount(d, "4242");
		expect(r.status).toBe(200);
		expect(d.endSessions).toHaveBeenCalledWith("4242");
		expect(d.unsubscribe).toHaveBeenCalledWith("4242");
		expect(await d.registry.byId("4242")).toBeNull();
	});

	it("si falla la baja de los eventos, el acceso se quita igual y se avisa", async () => {
		const d = deps();
		await addAccount(d, ADMIN, "sunara__");
		d.unsubscribe.mockRejectedValueOnce(new Error("Twitch caído"));
		const r = await removeAccount(d, "4242");
		expect(r.status).toBe(200);
		expect((r.body as { warning?: string }).warning).toMatch(/siguen dados de alta/);
		expect(await d.registry.byId("4242")).toBeNull();
	});

	it("un administrador no se quita, y una que ya no está da 404", async () => {
		const d = deps();
		expect((await removeAccount(d, ADMIN)).status).toBe(403);
		expect(d.endSessions).not.toHaveBeenCalled();
		expect((await removeAccount(d, "9999")).status).toBe(404);
	});
});

// specs/studio-accounts, «Administradores»: la API solo para ellos.
describe("API de cuentas", () => {
	const URL_ = "https://scaena.test/api/studio/accounts";

	it("una cuenta que no es administradora recibe 403 en todo, y no se toca nada", async () => {
		const d = deps();
		const sunara = { channelId: "4242", admin: false };
		for (const method of ["GET", "POST", "DELETE"])
			expect(
				(await handleAccounts(sunara, { method, url: `${URL_}?id=1337`, body: { login: "x" } }, d))
					.status,
			).toBe(403);
		expect(d.findUser).not.toHaveBeenCalled();
		expect(d.endSessions).not.toHaveBeenCalled();
	});

	it("el administrador lista, busca, añade y quita", async () => {
		const d = deps();
		const admin = { channelId: ADMIN, admin: true };
		expect((await handleAccounts(admin, { method: "GET", url: URL_ }, d)).body).toMatchObject({
			accounts: [{ login: "jotis_1" }],
		});
		expect(
			(await handleAccounts(admin, { method: "GET", url: `${URL_}?login=sunara__` }, d)).status,
		).toBe(200);
		expect(
			(await handleAccounts(admin, { method: "POST", url: URL_, body: { login: "sunara__" } }, d))
				.status,
		).toBe(200);
		expect((await handleAccounts(admin, { method: "POST", url: URL_, body: {} }, d)).status).toBe(400);
		expect((await handleAccounts(admin, { method: "DELETE", url: `${URL_}?id=4242` }, d)).status).toBe(
			200,
		);
		expect((await handleAccounts(admin, { method: "DELETE", url: `${URL_}?id=x` }, d)).status).toBe(400);
	});
});
