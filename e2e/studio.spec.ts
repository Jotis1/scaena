import { expect, test } from "@playwright/test";
import { CHANNEL_ID, redis, seedChannel } from "./redis";
import { createStudioUser, SESSION_COOKIE, type StudioUser, signCookie, signInAs } from "./session";

// Estudio (specs/obs-overlays): armazón, overlays, token, frases y alertas de prueba, con una sesión de
// better-auth de verdad en Postgres y el Redis falso.
test.describe.configure({ mode: "serial" });

let user: StudioUser;

test.beforeEach(async ({ context, baseURL }) => {
	await redis("FLUSHALL");
	await seedChannel();
	user = await createStudioUser();
	await signInAs(context, user, baseURL as string);
});
test.afterEach(async () => {
	await user?.remove();
});

test.describe("armazón", () => {
	test("/studio lleva a /studio/overlays y la barra marca la página actual", async ({ page }) => {
		await page.goto("/studio");
		await expect(page).toHaveURL(/\/studio\/overlays$/);
		const nav = page.getByRole("navigation", { name: "Estudio" });
		await expect(nav.getByRole("link", { name: "Overlays" })).toHaveAttribute("aria-current", "page");
		await nav.getByRole("link", { name: "Recursos" }).click();
		await expect(page).toHaveURL(/\/studio\/assets$/);
		await expect(nav.getByRole("link", { name: "Recursos" })).toHaveAttribute("aria-current", "page");
		await expect(nav.getByRole("link", { name: "Overlays" })).not.toHaveAttribute("aria-current", "page");
		// Cuenta de la sesión, sin selector de canal.
		await expect(page.getByText("jotis_1", { exact: true }).first()).toBeVisible();
		await expect(page.getByRole("combobox", { name: /canal/i })).toHaveCount(0);
	});

	test("«Salir» cierra la sesión", async ({ page }) => {
		await page.goto("/studio/overlays");
		await page.getByRole("button", { name: "Salir" }).click();
		await expect(page).toHaveURL(/\/studio\/login$/);
		await page.goto("/studio/overlays");
		await expect(page).toHaveURL(/\/studio\/login$/);
	});

	test("con una cookie de sesión inventada no se ve nada del estudio", async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		await context.addCookies([
			{ name: SESSION_COOKIE, value: signCookie("token-que-no-existe"), url: baseURL as string },
		]);
		const page = await context.newPage();
		await page.goto("/studio/overlays");
		// `proxy.ts` deja pasar (hay cookie); la página comprueba la sesión y manda a la entrada.
		await expect(page).toHaveURL(/\/studio\/login$/);
		await expect(page.getByText("Token de los overlays")).toHaveCount(0);
		const api = await context.request.post("/api/studio/test", { data: { type: "raid" } });
		expect(api.status()).toBe(401);
		await context.close();
	});
});

test.describe("overlays", () => {
	test("al marcar «translúcido» cambian la URL y la vista previa", async ({ page }) => {
		await page.goto("/studio/overlays");
		const chat = page.getByRole("article", { name: "Chat" });
		const url = chat.locator('[data-url="chat"]');
		await expect(url).toHaveValue(/\/overlay\/jotis_1\/chat\?translucent=1$/);
		const preview = chat.locator('[data-preview="chat"] [role="log"]');
		const before = await preview.evaluate((el) => el.outerHTML);
		await chat.getByText("Fondo translúcido", { exact: true }).click();
		await expect(url).toHaveValue(/\/overlay\/jotis_1\/chat$/);
		expect(await preview.evaluate((el) => el.outerHTML)).not.toBe(before);
	});

	test("las URL con eventos llevan el token tapado; copiar pone el de verdad", async ({
		page,
		context,
	}) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto("/studio/overlays");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const alerts = page.getByRole("article", { name: "Alertas" });
		await expect(alerts.locator('[data-url="alerts"]')).toHaveValue(
			new RegExp(`token=••••${token.slice(-4)}$`),
		);
		await alerts.getByRole("button", { name: "Copiar" }).click();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
			new RegExp(`token=${token}$`),
		);
		// La meta, con `since`.
		const goal = page.getByRole("article", { name: "Meta" });
		await expect(goal.locator('[data-url="goal"]')).toHaveValue(/since=\d{13}/);
		// «Enseñar espectadores», desactivado por defecto.
		await expect(page.getByRole("switch", { name: "Enseñar espectadores" })).not.toBeChecked();
	});

	test("cancelar la confirmación no rota el token", async ({ page }) => {
		await page.goto("/studio/overlays");
		const before = await redis("GET", `channel:${CHANNEL_ID}:token`);
		await page.getByRole("button", { name: "Rotar token" }).click();
		const dialog = page.getByRole("dialog", { name: "¿Rotar el token?" });
		await expect(dialog).toBeVisible();
		await dialog.getByRole("button", { name: "Cancelar" }).click();
		await expect(dialog).toHaveCount(0);
		expect(await redis("GET", `channel:${CHANNEL_ID}:token`)).toBe(before);
	});

	test("tras rotarlo, la URL vieja deja de recibir eventos", async ({ page, request }) => {
		await page.goto("/studio/overlays");
		const old = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const events = (t: string) => `/api/events?channel=jotis_1&token=${encodeURIComponent(t)}`;
		const ok = await fetch(new URL(events(old), page.url()), { signal: AbortSignal.timeout(3000) });
		expect(ok.status).toBe(200);
		await ok.body?.cancel();

		await page.getByRole("button", { name: "Rotar token" }).click();
		await page.getByRole("dialog").getByRole("button", { name: "Rotar token" }).click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		const fresh = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		expect(fresh).not.toBe(old);
		await expect(page.getByLabel("Token", { exact: true })).toHaveValue(
			new RegExp(`${fresh.slice(-4)}$`),
		);
		expect((await request.get(events(old))).status()).toBe(401);
	});

	test("una frase guardada se mantiene al recargar, y una mal escrita dice qué huecos valen", async ({
		page,
	}) => {
		await page.goto("/studio/overlays");
		const alerts = page.getByRole("article", { name: "Alertas" });
		const raid = alerts.getByLabel("Raid", { exact: true });
		await raid.fill("Hola, {nombre}.");
		await alerts.getByRole("button", { name: "Guardar frases" }).click();
		await expect(alerts.getByText(/\{nombre\}.*\{meses\}/)).toBeVisible();

		await raid.fill("Entran {espectadores} de golpe.");
		await alerts.getByRole("button", { name: "Guardar frases" }).click();
		await expect(alerts.getByText("Guardadas. La próxima alerta ya sale con ellas.")).toBeVisible();
		await page.reload();
		await expect(
			page.getByRole("article", { name: "Alertas" }).getByLabel("Raid", { exact: true }),
		).toHaveValue("Entran {espectadores} de golpe.");
	});

	test("«Raid - 1.284» hace entrar una alerta de raid con su frase en el overlay abierto en otra pestaña", async ({
		page,
		context,
	}) => {
		await page.goto("/studio/overlays");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const obs = await context.newPage();
		await obs.goto(`/overlay/jotis_1/alerts?token=${token}`);
		// Que el flujo esté abierto antes de disparar.
		await obs.waitForResponse((r) => r.url().includes("/api/events") && r.status() === 200);
		await page.getByRole("button", { name: "Raid - 1.284" }).click();
		await expect(page.getByText("Enviada: Raid - 1.284.")).toBeVisible();
		const card = obs.getByRole("status");
		await expect(card).toContainText("Canal de prueba", { timeout: 10_000 });
		await expect(card).toContainText("Llega con 1.284 personas. Bienvenidas.");
	});
});
