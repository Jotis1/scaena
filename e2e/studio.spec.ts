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
	// specs/channel-site, «Navegación del estudio».
	const sections = (page: Page) => page.getByRole("navigation", { name: "Secciones del estudio" });

	test("/studio lleva a Overlays; cambiar de sección marca la actual", async ({ page }) => {
		await page.goto("/studio");
		await expect(page).toHaveURL(/\/studio\/overlays$/);
		await expect(sections(page).getByRole("link", { name: "Overlays" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await sections(page).getByRole("link", { name: "Conexión" }).click();
		await expect(page).toHaveURL(/\/studio\/connection$/);
		await expect(sections(page).getByRole("link", { name: "Conexión" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(sections(page).getByRole("link", { name: "Overlays" })).not.toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	test("la cabecera es la de la web, con «Estudio» como página actual y el tema; sin barra lateral", async ({
		page,
	}) => {
		for (const path of ["/studio/overlays", "/studio/guide", "/studio/assets", "/studio/connection"]) {
			await page.goto(path);
			const header = page.getByRole("banner");
			await expect(header.getByRole("link", { name: "Estudio" }).first(), path).toHaveAttribute(
				"aria-current",
				"page",
			);
			await expect(header.getByRole("link", { name: "Vídeos" }).first(), path).toBeVisible();
			await expect(
				header.getByRole("button", { name: /^Tema: (Claro|Oscuro|Sistema)$/ }).first(),
				path,
			).toBeVisible();
			await expect(page.locator("aside"), path).toHaveCount(0);
		}
	});

	test("la cuenta y «Salir» se ven en la barra de secciones sin abrir nada", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 800 });
		await page.goto("/studio/guide");
		await expect(page.getByText("Cuenta de Twitch")).toBeInViewport();
		await expect(page.getByRole("button", { name: "Salir" })).toBeInViewport();
	});

	test("a 1920 px el contenido va centrado, con 1280 px como mucho", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		for (const path of ["/studio/overlays", "/studio/guide", "/studio/assets", "/studio/connection"]) {
			await page.goto(path);
			const box = await page.getByRole("heading", { level: 1 }).evaluate((h) => {
				let el: HTMLElement | null = h as HTMLElement;
				while (el && !el.className.includes("max-w-320")) el = el.parentElement;
				const r = (el as HTMLElement).getBoundingClientRect();
				return {
					left: r.left,
					right: document.documentElement.clientWidth - r.right,
					width: r.width,
				};
			});
			expect(box.width, path).toBeLessThanOrEqual(1280);
			expect(Math.abs(box.left - box.right), path).toBeLessThan(2);
		}
	});

	test("en el móvil, las secciones se desplazan en su barra y la página no", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		for (const path of ["/studio/overlays", "/studio/guide", "/studio/assets", "/studio/connection"]) {
			await page.goto(path);
			await expect(sections(page)).toBeAttached();
			await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
			const [scroll, client] = await page.evaluate(() => [
				document.documentElement.scrollWidth,
				document.documentElement.clientWidth,
			]);
			expect(scroll, path).toBeLessThanOrEqual(client);
		}
	});

	test("la web pública no enseña «Estudio» aunque haya sesión", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("banner").getByRole("link", { name: "Inicio" }).first()).toBeVisible();
		await expect(page.getByRole("banner").getByRole("link", { name: "Estudio" })).toHaveCount(0);
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

// specs/obs-overlays, «Página de URLs para copiar», «Rotar el token» y «Frases de alerta editables»; specs/twitch-events,
// «Disparo de prueba». Lista y detalle: el detalle es una región con el nombre de la fuente elegida.
test.describe("overlays", () => {
	const detail = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
	const pick = (page: Page, name: string) =>
		page.getByRole("tablist", { name: "Fuentes" }).getByRole("tab", { name, exact: true }).click();
	const kinds = (page: Page) => page.getByRole("tablist", { name: "Tipo de fuente" });

	test("copiar URL configurada: apagar «Fondo translúcido» cambia la URL y la vista previa", async ({
		page,
	}) => {
		await page.goto("/studio/overlays");
		const chat = detail(page, "Chat");
		const url = chat.locator('[data-url="chat"]');
		await expect(url).toHaveValue(/\/overlay\/jotis_1\/chat\?translucent=1$/);
		const preview = chat.locator('[data-preview="chat"] [role="log"]');
		const before = await preview.evaluate((el) => el.outerHTML);
		await chat.getByText("Fondo translúcido", { exact: true }).click();
		await expect(url).toHaveValue(/\/overlay\/jotis_1\/chat$/);
		expect(await preview.evaluate((el) => el.outerHTML)).not.toBe(before);
		await expect(chat.getByText("Sin token: el chat ya es público.")).toBeVisible();
	});

	test("cambiar a escenas: la lista enseña seis, el detalle pasa a juego y la URL de la página lo dice", async ({
		page,
	}) => {
		await page.goto("/studio/overlays");
		const list = page.getByRole("tablist", { name: "Fuentes" });
		await expect(list.getByRole("tab")).toHaveCount(6);
		await kinds(page)
			.getByRole("tab", { name: /Escenas/ })
			.click();
		await expect(page).toHaveURL(/\/studio\/overlays\?source=game$/);
		await expect(list.getByRole("tab")).toHaveCount(6);
		await expect(list.getByRole("tab", { name: "Chat", exact: true })).toHaveCount(0);
		await expect(detail(page, "Juego").locator('[data-preview="scene/game"]')).toBeAttached();
		await expect(detail(page, "Juego").getByText("1920 × 1080", { exact: true }).first()).toBeVisible();
		// Recargar no pierde la fuente.
		await page.reload();
		await expect(detail(page, "Juego")).toBeVisible();
	});

	test("el enlace antiguo `?tab=scenes` abre la escena de juego", async ({ page }) => {
		await page.goto("/studio/overlays?tab=scenes");
		await expect(detail(page, "Juego")).toBeVisible();
	});

	test("escenas en ultrapanorámico: URL, tamaño y 21:9, y el lienzo se conserva al cambiar de escena", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/studio/overlays?source=game");
		const game = detail(page, "Juego");
		await expect(game.locator('[data-url="scene/game"]')).not.toHaveValue(/canvas=/);
		await game.getByRole("button", { name: "3440 × 1440" }).click();
		await expect(game.getByRole("button", { name: "3440 × 1440" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(page).toHaveURL(/\?source=game&canvas=3440x1440$/);
		await expect(game.locator('[data-url="scene/game"]')).toHaveValue(/canvas=3440x1440/);
		const box = await game.locator('[data-preview="scene/game"]').boundingBox();
		expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(2580 / 1080, 1);
		await pick(page, "Offline");
		await expect(page).toHaveURL(/\?source=offline&canvas=3440x1440$/);
		await expect(detail(page, "Offline").locator('[data-url="scene/offline"]')).toHaveValue(
			/canvas=3440x1440/,
		);
		// Las piezas no llevan lienzo.
		await kinds(page)
			.getByRole("tab", { name: /Piezas/ })
			.click();
		await expect(page).toHaveURL(/\?source=chat$/);
		await expect(page.locator("[data-url]")).not.toHaveValue(/canvas=/);
	});

	test("copiar una URL: va el token de verdad y el botón lo confirma", async ({ page, context }) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto("/studio/overlays?source=game");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const game = detail(page, "Juego");
		await expect(game.locator('[data-url="scene/game"]')).toHaveValue(
			new RegExp(`token=••••${token.slice(-4)}$`),
		);
		await game.getByRole("button", { name: "Copiar" }).click();
		await expect(game.getByRole("button", { name: "Copiada" })).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
			new RegExp(`/overlay/jotis_1/scene/game\\?.*token=${token}$`),
		);
		// La meta solo lleva el token: se guarda en Scaena.
		await kinds(page)
			.getByRole("tab", { name: /Piezas/ })
			.click();
		await pick(page, "Meta");
		await expect(detail(page, "Meta").locator('[data-url="goal"]')).toHaveValue(
			new RegExp(`/overlay/jotis_1/goal\\?token=••••${token.slice(-4)}$`),
		);
	});

	test("token en la cabecera: tapado salvo los cuatro últimos, con «Rotar»", async ({ page }) => {
		await page.goto("/studio/overlays");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const field = page.getByRole("textbox", { name: "Token de los overlays" });
		await expect(field).toHaveValue(new RegExp(`^•+${token.slice(-4)}$`));
		await expect(page.getByRole("button", { name: "Rotar", exact: true })).toBeVisible();
	});

	test("la cuenta atrás de «Empezando» cambia la URL", async ({ page }) => {
		await page.goto("/studio/overlays?source=starting");
		const starting = detail(page, "Empezando");
		await expect(starting.locator('[data-url="scene/starting"]')).toHaveValue(/minutes=5/);
		await starting.getByRole("button", { name: /Sumar/ }).click();
		await expect(starting.locator('[data-url="scene/starting"]')).toHaveValue(/minutes=6/);
	});

	test("cancelar la confirmación no rota el token", async ({ page }) => {
		await page.goto("/studio/overlays");
		const before = await redis("GET", `channel:${CHANNEL_ID}:token`);
		await page.getByRole("button", { name: "Rotar", exact: true }).click();
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

		await page.getByRole("button", { name: "Rotar", exact: true }).click();
		await page.getByRole("dialog").getByRole("button", { name: "Rotar token" }).click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		const fresh = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		expect(fresh).not.toBe(old);
		await expect(page.getByRole("textbox", { name: "Token de los overlays" })).toHaveValue(
			new RegExp(`${fresh.slice(-4)}$`),
		);
		expect((await request.get(events(old))).status()).toBe(401);
	});

	test("hueco de otra alerta: el error sale al escribir y «Guardar frases» se desactiva", async ({
		page,
	}) => {
		await page.goto("/studio/overlays?source=alerts");
		const alerts = detail(page, "Alertas");
		const save = alerts.getByRole("button", { name: "Guardar frases" });
		const bits = alerts.getByRole("textbox", { name: "Frase de 500 bits" });
		await bits.fill("{bit} bits. Muchas gracias.");
		await expect(
			alerts.getByText("El hueco {bit} no vale aquí. En esta alerta solo se rellena {bits}."),
		).toBeVisible();
		await expect(save).toBeDisabled();
		await bits.fill("{bits} bits. Muchas gracias.");
		const follow = alerts.getByRole("textbox", { name: "Frase de follow" });
		await follow.fill("{meses} meses ya.");
		await expect(alerts.getByText(/\{meses\} no vale aquí\. Esta alerta no tiene huecos/)).toBeVisible();
		await expect(save).toBeDisabled();
		await follow.fill("Gracias por seguir.");
		await expect(save).toBeEnabled();
	});

	test("una frase guardada se mantiene al recargar", async ({ page }) => {
		await page.goto("/studio/overlays?source=alerts");
		const raid = () => detail(page, "Alertas").getByRole("textbox", { name: "Frase de raid de 1.284" });
		await raid().fill("Entran {espectadores} de golpe.");
		await expect(detail(page, "Alertas").getByText("Ahora dice: Entran 1.284 de golpe.")).toBeVisible();
		await detail(page, "Alertas").getByRole("button", { name: "Guardar frases" }).click();
		await expect(page.getByText("Guardadas. La próxima alerta ya sale con ellas.")).toBeVisible();
		await page.reload();
		await expect(raid()).toHaveValue("Entran {espectadores} de golpe.");
	});

	test("probar una alerta: «Raid de 1.284» llega al overlay abierto en otra pestaña y el estudio lo confirma", async ({
		page,
		context,
	}) => {
		await page.goto("/studio/overlays?source=alerts");
		const token = String(await redis("GET", `channel:${CHANNEL_ID}:token`));
		const obs = await context.newPage();
		await obs.goto(`/overlay/jotis_1/alerts?token=${token}`);
		// Que el flujo esté abierto antes de disparar.
		await obs.waitForResponse((r) => r.url().includes("/api/events") && r.status() === 200);
		await detail(page, "Alertas").getByRole("button", { name: "Raid de 1.284" }).click();
		await expect(page.getByText("Prueba enviada a OBS: Raid de 1.284.")).toBeVisible();
		const card = obs.getByRole("status");
		await expect(card).toContainText("Canal de prueba", { timeout: 10_000 });
		await expect(card).toContainText("Llega con 1.284 personas. Bienvenidas.");
	});

	test("axe sin errores en una pieza y en una escena", async ({ page }) => {
		for (const path of ["/studio/overlays?source=alerts", "/studio/overlays?source=game"]) {
			await page.goto(path);
			await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
			const axe = await new AxeBuilder({ page }).analyze();
			expect(
				axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`),
				path,
			).toEqual([]);
		}
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
		const nav = page.getByRole("navigation", { name: "Secciones del estudio" });
		await expect(nav.getByRole("link", { name: "Guía de OBS" })).toHaveAttribute("aria-current", "page");
		const camera = row(page, "game", "Cámara");
		await expect(camera).toContainText("1.488, 816");
		await expect(camera).toContainText("384 × 216");
		// De arriba abajo: la escena de Scaena, la cámara y el juego.
		const names = await section(page, "game").getByRole("row").allInnerTexts();
		const cells = (t: string) => t.split(/[\t\n]/).map((c) => c.trim());
		const order = ["Escena de juego", "Cámara", "Juego"].map((n) =>
			names.findIndex((t) => cells(t).includes(n)),
		);
		expect(order.every((v, i) => v > 0 && (i === 0 || v > (order[i - 1] ?? 0)))).toBe(true);
		await expect(row(page, "chatting", "Cámara")).toContainText("64, 112");
		// El esquema pone la cámara donde la tabla: 77,5 % y 75,56 % del lienzo.
		const cam = await section(page, "game")
			.locator("[data-diagram-camera]")
			.evaluate((el) => [(el as HTMLElement).style.left, (el as HTMLElement).style.top]);
		expect(cam).toEqual(["77.5%", "75.56%"]);
		await expect(section(page, "chatting")).toContainText("Aquí no hace falta máscara");
		const axe = await new AxeBuilder({ page }).analyze();
		expect(axe.violations.map((v) => v.id)).toEqual([]);
	});

	test("medidas en ultrapanorámico", async ({ page }) => {
		await page.goto("/studio/guide");
		await page
			.getByRole("group", { name: "Tu lienzo en OBS" })
			.getByRole("button", { name: "3440 × 1440" })
			.click();
		await expect(page).toHaveURL(/\/studio\/guide\?canvas=3440x1440$/);
		await expect(row(page, "game", "Escena de juego")).toContainText("3.440 × 1.440");
		const camera = row(page, "game", "Cámara");
		await expect(camera).toContainText("2.864, 1.088");
		await expect(camera).toContainText("512 × 288");
		// Los esquemas pasan a 21:9.
		const d = await section(page, "game").locator("[data-diagram]").boundingBox();
		expect((d?.width ?? 0) / (d?.height ?? 1)).toBeCloseTo(2580 / 1080, 1);
	});

	test("índice de la guía: «Just Chatting» baja a su sección", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 800 });
		await page.goto("/studio/guide");
		await page
			.getByRole("navigation", { name: "En esta guía" })
			.getByRole("link", { name: "Just Chatting" })
			.click();
		await expect(page).toHaveURL(/#chatting$/);
		await expect(page.getByRole("heading", { level: 2, name: "Just Chatting" })).toBeInViewport();
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
		await page.goto("/studio/overlays?source=game&canvas=3440x1440");
		await page
			.getByRole("region", { name: "Juego", exact: true })
			.getByRole("link", { name: "Cómo montarla en OBS" })
			.click();
		await expect(page).toHaveURL(/\/studio\/guide\?canvas=3440x1440#game$/);
		await expect(row(page, "game", "Cámara")).toContainText("512 × 288");
		await expect(section(page, "game")).toBeInViewport();
		await page.goto("/studio/overlays?source=offline");
		await page
			.getByRole("region", { name: "Offline", exact: true })
			.getByRole("link", { name: "Cómo montarla en OBS" })
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
		await page.goto("/studio/overlays?source=goal");
		const card = page.getByRole("region", { name: "Meta", exact: true });
		await card.getByRole("button", { name: /Tipo/ }).click();
		await page.getByRole("option", { name: "Seguidores" }).click();
		await expect(card.getByRole("textbox", { name: "Texto" })).toHaveValue("Meta de seguidores");
		await card.getByRole("textbox", { name: "Objetivo" }).fill("50");
		await card.getByRole("textbox", { name: "Llevas" }).fill("10");
		await card.getByRole("button", { name: "Guardar meta" }).click();
		await expect(card.getByText("Guardada. La pieza y las escenas ya la enseñan.")).toBeVisible();
		expect(Number(await redis("GET", `channel:${CHANNEL_ID}:goal`))).toBe(10);

		await page
			.getByRole("tablist", { name: "Tipo de fuente" })
			.getByRole("tab", { name: /Escenas/ })
			.click();
		// La vista previa es decorativa (`aria-hidden`): se busca por el atributo, no por el rol accesible.
		const preview = page.locator('[data-preview="scene/game"] [role="progressbar"]');
		await expect(preview).toHaveAttribute("aria-valuenow", "10");
		await expect(preview).toHaveAttribute("aria-valuemax", "50");

		await page.goto("/studio/overlays?source=goal");
		const again = page.getByRole("region", { name: "Meta", exact: true });
		await expect(again.getByRole("textbox", { name: "Texto" })).toHaveValue("Meta de seguidores");
		await expect(again.getByRole("textbox", { name: "Objetivo" })).toHaveValue("50");
		await expect(again.getByRole("textbox", { name: "Llevas" })).toHaveValue("10");
	});

	test("objetivo 0: no se guarda y lo dice en el campo", async ({ page }) => {
		await page.goto("/studio/overlays?source=goal");
		const card = page.getByRole("region", { name: "Meta", exact: true });
		await card.getByRole("textbox", { name: "Objetivo" }).fill("0");
		await card.getByRole("button", { name: "Guardar meta" }).click();
		await expect(card.getByText("El objetivo tiene que ser mayor que cero.")).toBeVisible();
		expect(await redis("GET", `channel:${CHANNEL_ID}:settings`)).toBeNull();
	});
});

// Capturas para revisar a mano contra el canvas (`E2E_SHOTS=<carpeta>`): cada página del estudio, en escritorio y a
// 390 px, en claro y oscuro.
test.describe("capturas del estudio", () => {
	test.skip(!process.env.E2E_SHOTS, "solo con E2E_SHOTS");
	const PAGES = [
		["overlays-alertas", "/studio/overlays?source=alerts"],
		["overlays-juego", "/studio/overlays?source=game"],
		["guia", "/studio/guide"],
		["recursos", "/studio/assets"],
		["conexion", "/studio/connection"],
	] as const;
	for (const scheme of ["light", "dark"] as const)
		for (const [w, h] of [
			[1440, 900],
			[390, 844],
		] as const)
			test(`estudio en ${scheme} a ${w} px`, async ({ page, browser }) => {
				await page.emulateMedia({ colorScheme: scheme });
				await page.setViewportSize({ width: w, height: h });
				for (const [name, path] of PAGES) {
					await page.goto(path);
					await page.waitForLoadState("networkidle");
					await page.screenshot({
						path: `${process.env.E2E_SHOTS}/${name}-${w}-${scheme}.png`,
						fullPage: true,
					});
				}
				// La entrada, sin sesión.
				const fresh = await browser.newContext({
					viewport: { width: w, height: h },
					colorScheme: scheme,
				});
				const login = await fresh.newPage();
				await login.goto("/studio/login");
				await login.screenshot({
					path: `${process.env.E2E_SHOTS}/acceso-${w}-${scheme}.png`,
					fullPage: true,
				});
				await fresh.close();
			});
});
