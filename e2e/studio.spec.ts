import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { F, twitchEvent } from "./eventsub";
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
		for (const path of ["/studio/overlays", "/studio/guide", "/studio/assets", "/studio/connection"]) {
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
		for (const path of ["/studio/overlays", "/studio/guide", "/studio/assets", "/studio/connection"]) {
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
		// La meta solo lleva el token: se guarda en Scaena.
		const goal = page.getByRole("article", { name: "Meta" });
		await expect(goal.locator('[data-url="goal"]')).toHaveValue(
			new RegExp(`/overlay/jotis_1/goal\\?token=••••${token.slice(-4)}$`),
		);
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

// specs/obs-overlays, «Guía de montaje en OBS» y «Máscara de la cámara».
test.describe("guía de OBS", () => {
	const section = (page: Page, id: string) => page.locator(`section#${id}`);
	const row = (page: Page, id: string, name: string) =>
		section(page, id)
			.getByRole("row")
			.filter({ has: page.getByText(name, { exact: true }) });

	test("medidas de la escena de juego en 1920 × 1080, en orden de capas", async ({ page }) => {
		await page.goto("/studio/guide");
		await expect(page.getByRole("heading", { level: 1, name: "Guía de OBS" })).toBeVisible();
		const nav = page.getByRole("navigation", { name: "Estudio" });
		await expect(nav.getByRole("link", { name: "Guía de OBS" })).toHaveAttribute("aria-current", "page");
		const camera = row(page, "game", "Cámara");
		await expect(camera).toContainText("x 1488 · y 816");
		await expect(camera).toContainText("384 × 216");
		// De arriba abajo: la escena de Scaena, la cámara y el juego.
		const names = await section(page, "game").getByRole("row").allInnerTexts();
		const cells = (t: string) => t.split(/[\t\n]/).map((c) => c.trim());
		const order = ["Scaena · Juego", "Cámara", "Juego"].map((n) =>
			names.findIndex((t) => cells(t).includes(n)),
		);
		expect(order.every((v, i) => v > 0 && (i === 0 || v > (order[i - 1] ?? 0)))).toBe(true);
		await expect(row(page, "chatting", "Cámara")).toContainText("x 64 · y 112");
		await expect(section(page, "chatting")).toContainText("Aquí no hace falta máscara");
		const axe = await new AxeBuilder({ page }).analyze();
		expect(axe.violations.map((v) => v.id)).toEqual([]);
	});

	test("medidas en ultrapanorámico", async ({ page }) => {
		await page.goto("/studio/guide");
		await page.getByRole("button", { name: /Lienzo/ }).click();
		await page.getByRole("option", { name: "3440 × 1440" }).click();
		await expect(page).toHaveURL(/\/studio\/guide\?canvas=3440x1440$/);
		await expect(row(page, "game", "Scaena · Juego")).toContainText("3440 × 1440");
		const camera = row(page, "game", "Cámara");
		await expect(camera).toContainText("x 2864 · y 1088");
		await expect(camera).toContainText("512 × 288");
	});

	test("descargar la máscara: PNG 16:9, blanco dentro y transparente en las esquinas", async ({ page }) => {
		await page.goto("/studio/guide");
		const link = section(page, "game").getByRole("link", { name: "Descargar máscara" });
		await expect(link).toHaveAttribute("download", "");
		const href = (await link.getAttribute("href")) ?? "";
		const res = await page.request.get(href);
		expect(res.headers()["content-type"]).toBe("image/png");
		const px = await page.evaluate(async (src) => {
			const img = new Image();
			img.src = src;
			await img.decode();
			const c = document.createElement("canvas");
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			const g = c.getContext("2d");
			if (!g) throw new Error("sin canvas");
			g.drawImage(img, 0, 0);
			const at = (x: number, y: number) => Array.from(g.getImageData(x, y, 1, 1).data);
			return {
				size: [img.naturalWidth, img.naturalHeight],
				corner: at(0, 0),
				center: at(960, 540),
				edge: at(960, 0),
			};
		}, href);
		expect(px.size).toEqual([1920, 1080]);
		expect(px.corner[3]).toBe(0);
		expect(px.center).toEqual([255, 255, 255, 255]);
		// El borde recto, lejos de las esquinas, ya es opaco: solo se recortan las esquinas.
		expect(px.edge[3]).toBe(255);
	});

	test("«Cómo montarla» lleva a su sección con el mismo lienzo", async ({ page }) => {
		await page.goto("/studio/overlays?tab=scenes&canvas=3440x1440");
		await page
			.getByRole("article", { name: "Juego" })
			.getByRole("link", { name: "Cómo montarla" })
			.click();
		await expect(page).toHaveURL(/\/studio\/guide\?canvas=3440x1440#game$/);
		await expect(row(page, "game", "Cámara")).toContainText("512 × 288");
		await expect(section(page, "game")).toBeInViewport();
		await page.goto("/studio/overlays?tab=scenes");
		await page
			.getByRole("article", { name: "Offline" })
			.getByRole("link", { name: "Cómo montarla" })
			.click();
		await expect(page).toHaveURL(/\/studio\/guide#fullscreen$/);
	});
});

// specs/obs-overlays, «Meta editable en el estudio», y specs/twitch-events, «Eventos recientes y metas»: contra el
// servidor de verdad, con el flujo SSE real y eventos firmados al webhook.
test.describe("meta guardada en vivo", () => {
	const SUBS = { type: "subs", label: "Subs del mes", target: 300 };
	const bar = (page: Page) => page.getByRole("progressbar");
	async function tokenOf(page: Page) {
		await page.goto("/studio/overlays");
		return String(await redis("GET", `channel:${CHANNEL_ID}:token`));
	}
	const saveGoal = (page: Page, data: object) => page.request.put("/api/studio/settings", { data });

	test("cambiar el objetivo llega a la escena de juego abierta, sin recargarla", async ({
		page,
		context,
	}) => {
		const token = await tokenOf(page);
		expect((await saveGoal(page, { goal: SUBS, current: 290 })).status()).toBe(200);
		const obs = await context.newPage();
		await obs.setViewportSize({ width: 1920, height: 1080 });
		await obs.goto(`/overlay/jotis_1/scene/game?token=${token}`);
		await expect(bar(obs)).toHaveAttribute("aria-valuenow", "290");
		await expect(bar(obs)).toHaveAttribute("aria-valuemax", "300");
		// Si la página se recargara, esta marca desaparecería.
		await obs.evaluate(() => {
			(window as unknown as { sinRecargar: boolean }).sinRecargar = true;
		});
		await saveGoal(page, { goal: { ...SUBS, target: 350 } });
		await expect(bar(obs)).toHaveAttribute("aria-valuemax", "350", { timeout: 10_000 });
		await expect(bar(obs)).toHaveAttribute("aria-valuenow", "290");
		expect(await obs.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar)).toBe(
			true,
		);
	});

	test("con la pieza y la escena abiertas, una sub sube las dos en 1 y la cuenta guardada también", async ({
		page,
		context,
	}) => {
		const token = await tokenOf(page);
		await saveGoal(page, { goal: SUBS, current: 290 });
		const piece = await context.newPage();
		const scene = await context.newPage();
		await piece.goto(`/overlay/jotis_1/goal?token=${token}`);
		await scene.goto(`/overlay/jotis_1/scene/game?token=${token}`);
		await expect(bar(piece)).toHaveAttribute("aria-valuenow", "290");
		await expect(bar(scene)).toHaveAttribute("aria-valuenow", "290");
		expect(await twitchEvent(page.request, F.SUB)).toBe(204);
		await expect(bar(piece)).toHaveAttribute("aria-valuenow", "291", { timeout: 10_000 });
		await expect(bar(scene)).toHaveAttribute("aria-valuenow", "291", { timeout: 10_000 });
		expect(Number(await redis("GET", `channel:${CHANNEL_ID}:goal`))).toBe(291);
	});

	test("con OBS cerrado, tres follows suman igual: al abrir la pieza sale 43", async ({ page }) => {
		const token = await tokenOf(page);
		await saveGoal(page, { goal: { type: "follows", label: "Seguidores", target: 50 }, current: 40 });
		for (let i = 0; i < 3; i++) expect(await twitchEvent(page.request, F.FOLLOW)).toBe(204);
		await page.goto(`/overlay/jotis_1/goal?token=${token}`);
		await expect(page.getByText("Seguidores", { exact: true })).toBeVisible();
		await expect(bar(page)).toHaveAttribute("aria-valuenow", "43");
	});
});

test.describe("tarjeta de la meta", () => {
	test("guardar seguidores, 50 y «Llevas» 10 cambia la vista previa de la escena, y al recargar sigue", async ({
		page,
	}) => {
		await page.goto("/studio/overlays");
		const card = page.getByRole("article", { name: "Meta" });
		await card.getByRole("button", { name: /Tipo/ }).click();
		await page.getByRole("option", { name: "Seguidores" }).click();
		await expect(card.getByRole("textbox", { name: "Texto" })).toHaveValue("Seguidores del mes");
		await card.getByRole("textbox", { name: "Objetivo" }).fill("50");
		await card.getByRole("textbox", { name: "Llevas" }).fill("10");
		await card.getByRole("button", { name: "Guardar meta" }).click();
		await expect(card.getByText("Guardada. La pieza y las escenas ya la enseñan.")).toBeVisible();
		expect(Number(await redis("GET", `channel:${CHANNEL_ID}:goal`))).toBe(10);

		await page.getByRole("tab", { name: /Escenas/ }).click();
		// La vista previa es decorativa (`aria-hidden`): se busca por el atributo, no por el rol accesible.
		const preview = page.locator('[data-preview="scene/game"] [role="progressbar"]');
		await expect(preview).toHaveAttribute("aria-valuenow", "10");
		await expect(preview).toHaveAttribute("aria-valuemax", "50");

		await page.goto("/studio/overlays");
		const again = page.getByRole("article", { name: "Meta" });
		await expect(again.getByRole("textbox", { name: "Texto" })).toHaveValue("Seguidores del mes");
		await expect(again.getByRole("textbox", { name: "Objetivo" })).toHaveValue("50");
		await expect(again.getByRole("textbox", { name: "Llevas" })).toHaveValue("10");
	});

	test("objetivo 0: no se guarda y lo dice en el campo", async ({ page }) => {
		await page.goto("/studio/overlays");
		const card = page.getByRole("article", { name: "Meta" });
		await card.getByRole("textbox", { name: "Objetivo" }).fill("0");
		await card.getByRole("button", { name: "Guardar meta" }).click();
		await expect(card.getByText("El objetivo tiene que ser mayor que cero.")).toBeVisible();
		expect(await redis("GET", `channel:${CHANNEL_ID}:settings`)).toBeNull();
	});
});

// Capturas para revisar a mano (`E2E_SHOTS=<carpeta>`): la guía en los dos lienzos, en claro y oscuro, y la meta.
test.describe("capturas de la guía y la meta", () => {
	test.skip(!process.env.E2E_SHOTS, "solo con E2E_SHOTS");
	for (const scheme of ["light", "dark"] as const)
		test(`guía y meta en ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await page.setViewportSize({ width: 1440, height: 900 });
			for (const canvas of ["1920x1080", "3440x1440"]) {
				await page.goto(`/studio/guide${canvas === "1920x1080" ? "" : `?canvas=${canvas}`}`);
				await page.screenshot({
					path: `${process.env.E2E_SHOTS}/guide-${canvas}-${scheme}.png`,
					fullPage: true,
				});
			}
			await page.goto("/studio/overlays");
			await page
				.getByRole("article", { name: "Meta" })
				.screenshot({ path: `${process.env.E2E_SHOTS}/goal-card-${scheme}.png` });
		});
});
