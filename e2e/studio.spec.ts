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

	test("a 1920 px el contenido va centrado en el espacio a la derecha de la barra lateral", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		for (const path of ["/studio/overlays", "/studio/assets", "/studio/connection"]) {
			await page.goto(path);
			const gaps = await page.locator("main").evaluate((main) => {
				// La barra lateral es lo de antes del contenedor de `main`.
				const sidebar = main.parentElement?.previousElementSibling;
				if (!sidebar) throw new Error("no hay barra lateral antes del contenido");
				const s = sidebar.getBoundingClientRect();
				const m = main.getBoundingClientRect();
				return { left: m.left - s.right, right: document.documentElement.clientWidth - m.right };
			});
			// Con 1180 px de máximo, sobra sitio a los dos lados.
			expect(gaps.left, path).toBeGreaterThan(50);
			expect(Math.abs(gaps.left - gaps.right), path).toBeLessThan(2);
		}
	});

	test("la barra lateral es fija: la cuenta y «Salir» se ven sin bajar, también al final de la página", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 800 });
		await page.goto("/studio/overlays");
		const logout = page.getByRole("button", { name: "Salir" });
		await expect(logout).toBeInViewport();
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect(logout).toBeInViewport();
		await expect(page.getByText("Cuenta de Twitch")).toBeInViewport();
	});

	test("sin migas: cada página lleva el botón de tema en su cabecera", async ({ page }) => {
		for (const path of ["/studio/overlays", "/studio/assets", "/studio/connection"]) {
			await page.goto(path);
			await expect(page.getByRole("navigation", { name: "Ruta en el estudio" })).toHaveCount(0);
			const header = page
				.locator("main")
				.getByRole("heading", { level: 1 })
				.locator("xpath=ancestor::header[1]");
			await expect(
				header.getByRole("button", { name: /^Tema: (Claro|Oscuro|Sistema)$/ }),
				path,
			).toBeVisible();
		}
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

	test("«Piezas» y «Escenas»: seis y seis, la pestaña en la URL y la URL de juego se copia", async ({
		page,
		context,
	}) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto("/studio/overlays");
		const tabs = page.getByRole("tablist", { name: "Fuentes de navegador" });
		await expect(tabs.getByRole("tab", { name: /Piezas/ })).toHaveAttribute("aria-selected", "true");
		await expect(page.getByRole("article")).toHaveCount(6);
		await expect(page.getByRole("article", { name: "Juego" })).toHaveCount(0);
		await tabs.getByRole("tab", { name: /Escenas/ }).click();
		await expect(page).toHaveURL(/\/studio\/overlays\?tab=scenes$/);
		await expect(page.getByRole("article")).toHaveCount(6);
		await expect(page.getByRole("article", { name: "Chat", exact: true })).toHaveCount(0);
		const game = page.getByRole("article", { name: "Juego" });
		await expect(game.locator('[data-preview="scene/game"]')).toBeVisible();
		await game.getByRole("button", { name: "Copiar" }).click();
		await expect(game.getByRole("button", { name: "Copiada" })).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
			/\/overlay\/jotis_1\/scene\/game/,
		);
		// Recargar no pierde la pestaña.
		await page.reload();
		await expect(page.getByRole("article", { name: "Juego" })).toBeVisible();
		// La indicación de OBS va una vez, en la cabecera.
		await expect(page.getByText(/Actualizar al hacer visible la escena/)).toHaveCount(1);
	});

	test("escenas en ultrapanorámico: «3440 × 1440» cambia las seis URL, las insignias y las vistas previas", async ({
		page,
	}) => {
		const SCENES = ["game", "chatting", "starting", "brb", "ending", "offline"];
		await page.goto("/studio/overlays?tab=scenes");
		const urls = page.locator('[data-url^="scene/"]');
		await expect(urls).toHaveCount(6);
		for (const url of await urls.all()) await expect(url).not.toHaveValue(/canvas=/);
		await expect(page.getByRole("article").getByText("1920 × 1080", { exact: true })).toHaveCount(6);
		const preview = page.locator('[data-preview="scene/game"]');
		expect((await preview.boundingBox())?.height).toBeCloseTo(202, 0);

		await page
			.getByRole("button", { name: /Lienzo/ })
			.or(page.getByRole("combobox", { name: "Lienzo" }))
			.click();
		await page.getByRole("option", { name: "3440 × 1440" }).click();
		await expect(page).toHaveURL(/\/studio\/overlays\?tab=scenes&canvas=3440x1440$/);
		for (const kind of SCENES)
			await expect(page.locator(`[data-url="scene/${kind}"]`), kind).toHaveValue(/canvas=3440x1440/);
		await expect(page.getByRole("article").getByText("3440 × 1440", { exact: true })).toHaveCount(6);
		// 21:9: 360 × 151.
		for (const kind of SCENES) {
			const b = await page.locator(`[data-preview="scene/${kind}"]`).boundingBox();
			expect(
				[b?.width, b?.height].map((n) => Math.round(n ?? 0)),
				kind,
			).toEqual([360, 151]);
		}
		// La escena llena la vista previa, sin bandas: el lienzo de juego mide lo mismo que la caja.
		const game = await preview.locator("[data-scene=game]").boundingBox();
		expect(Math.round(game?.width ?? 0)).toBe(360);

		// Recargar no pierde el lienzo, y las piezas no lo llevan.
		await page.reload();
		await expect(page.locator('[data-url="scene/offline"]')).toHaveValue(/canvas=3440x1440/);
		await page.getByRole("tab", { name: /Piezas/ }).click();
		await expect(page).toHaveURL(/\/studio\/overlays$/);
		for (const url of await page.locator("[data-url]").all())
			await expect(url).not.toHaveValue(/canvas=/);
		await page.getByRole("tab", { name: /Escenas/ }).click();
		await expect(page).toHaveURL(/\?tab=scenes&canvas=3440x1440$/);
	});

	test("la cuenta atrás de «Empezando» cambia la URL", async ({ page }) => {
		await page.goto("/studio/overlays?tab=scenes");
		const starting = page.getByRole("article", { name: "Empezando" });
		await expect(starting.locator('[data-url="scene/starting"]')).toHaveValue(/minutes=5/);
		await starting.getByRole("button", { name: /Sumar/ }).click();
		await expect(starting.locator('[data-url="scene/starting"]')).toHaveValue(/minutes=6/);
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

	test("«Raid de 1.284» hace entrar una alerta de raid con su frase en el overlay abierto en otra pestaña", async ({
		page,
		context,
	}) => {
		await page.goto("/studio/overlays");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const obs = await context.newPage();
		await obs.goto(`/overlay/jotis_1/alerts?token=${token}`);
		// Que el flujo esté abierto antes de disparar.
		await obs.waitForResponse((r) => r.url().includes("/api/events") && r.status() === 200);
		await page.getByRole("button", { name: "Raid de 1.284" }).click();
		await expect(page.getByText("Enviada: Raid de 1.284.")).toBeVisible();
		const card = obs.getByRole("status");
		await expect(card).toContainText("Canal de prueba", { timeout: 10_000 });
		await expect(card).toContainText("Llega con 1.284 personas. Bienvenidas.");
	});
});
