import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { CHANNEL_ID, redis, seedChannel, setJson } from "./redis";

// Web pública (specs/channel-site): cabecera, tema, portada y aviso de directo. El servidor lee el estado y los
// vídeos del Redis falso; el sondeo del navegador a `/api/status` se simula donde hace falta.
test.describe.configure({ mode: "serial" });

const LIVE = {
	live: true,
	title: "Elden Ring sin prisa",
	category: "Elden Ring",
	viewers: 1284,
	startedAt: new Date(Date.now() - (2 * 3600 + 14 * 60 + 5) * 1000).toISOString(),
};

const VIDEOS = Array.from({ length: 8 }, (_, i) => ({
	id: `v${i + 1}`,
	title: i % 2 ? `Resumen ${i + 1}` : `Parte ${i + 1} - Cyberpunk 2077 #${i + 1}`,
	publishedAt: new Date(Date.UTC(2026, 9, 29 - i, 19)).toISOString(),
	thumbnail: "",
	duration: 3725,
}));

async function seed(status: object = { live: false }) {
	await redis("FLUSHALL");
	await seedChannel();
	await setJson(`channel:${CHANNEL_ID}:status`, status);
	await setJson(`channel:${CHANNEL_ID}:youtube`, { videos: VIDEOS, fetchedAt: Date.now() });
}

const primaries = (page: Page) => page.locator("a.bg-brand-solid, button.bg-brand-solid");

test.beforeEach(() => seed());

test.describe("cabecera y tema", () => {
	for (const scheme of ["light", "dark"] as const)
		test(`cabecera con «Sc» y «Scaena» en Bricolage bold, sin «jotis.me» (${scheme})`, async ({
			browser,
		}) => {
			const context = await browser.newContext({ colorScheme: scheme });
			const page = await context.newPage();
			await page.goto("/");
			const header = page.locator("header").first();
			// `HeaderNav` lleva la fila de escritorio y la de móvil; se mira la que se ve.
			await expect(
				header.getByRole("img", { name: "Scaena" }).locator("visible=true").first(),
			).toBeVisible();
			const name = header.getByText("Scaena", { exact: true }).locator("visible=true").first();
			const font = await name.evaluate((el) => {
				const s = getComputedStyle(el);
				return { family: s.fontFamily, weight: s.fontWeight };
			});
			expect(font.family).toMatch(/Bricolage/);
			expect(font.weight).toBe("700");
			await expect(header).not.toContainText("jotis.me");
			// Sin elección guardada, el selector marca «Sistema» sea cual sea el tema del sistema.
			await expect(
				header.getByRole("button", { name: "Tema: Sistema" }).locator("visible=true"),
			).toBeVisible();
			await context.close();
		});

	test("página actual en la cabecera: «Vídeos» marcado con un subrayado y sin fondo resaltado", async ({
		page,
	}) => {
		await page.goto("/videos");
		const nav = page.locator("header").first();
		const videos = nav.getByRole("link", { name: "Vídeos", exact: true }).locator("visible=true");
		await expect(videos).toHaveAttribute("aria-current", "page");
		await expect(
			nav.getByRole("link", { name: "Inicio", exact: true }).locator("visible=true"),
		).not.toHaveAttribute("aria-current", "page");
		const style = await videos.evaluate((el) => {
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, shadow: s.boxShadow };
		});
		expect(style.bg).toBe("rgba(0, 0, 0, 0)");
		// El subrayado es una sombra interior de 2 px abajo.
		expect(style.shadow).toMatch(/inset/);
		expect(style.shadow).toMatch(/0px -2px 0px/);
	});

	test("cabecera a todo el ancho: a 1920 px, la marca al margen izquierdo y el buscador al derecho", async ({
		browser,
	}) => {
		const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
		const page = await context.newPage();
		await page.goto("/");
		const header = page.locator("header").first();
		const brand = await header
			.getByRole("link", { name: "Scaena, inicio" })
			.locator("visible=true")
			.boundingBox();
		const search = await header
			.getByRole("searchbox", { name: "Buscar vídeos" })
			.locator("visible=true")
			.boundingBox();
		const theme = await header
			.getByRole("button", { name: /^Tema: / })
			.locator("visible=true")
			.boundingBox();
		if (!brand || !search || !theme) throw new Error("falta la marca, el buscador o el selector de tema");
		expect(brand.x).toBeLessThan(64);
		expect(search.x + search.width).toBeGreaterThan(1920 - 64);
		// El selector de tema, a la izquierda del buscador.
		expect(theme.x + theme.width).toBeLessThanOrEqual(search.x);
		await context.close();
	});

	test("en móvil: el tema en la fila de arriba, el buscador en el menú y sin desplazamiento horizontal", async ({
		browser,
	}) => {
		const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
		const page = await context.newPage();
		for (const path of ["/", "/videos"]) {
			await page.goto(path);
			const header = page.locator("header").first();
			const menu = page.getByRole("button", { name: "Abrir menú" });
			await expect(menu).toBeVisible();
			const theme = header.getByRole("button", { name: /^Tema: / }).locator("visible=true");
			await expect(theme).toHaveCount(1);
			const [themeBox, menuBox] = await Promise.all([theme.boundingBox(), menu.boundingBox()]);
			if (!themeBox || !menuBox) throw new Error("falta el selector de tema o el botón de menú");
			// En la misma fila que el botón de menú, a su izquierda.
			expect(
				Math.abs(themeBox.y + themeBox.height / 2 - (menuBox.y + menuBox.height / 2)),
			).toBeLessThan(2);
			expect(themeBox.x + themeBox.width).toBeLessThanOrEqual(menuBox.x);
			await expect(
				page.getByRole("searchbox", { name: "Buscar vídeos" }).locator("visible=true"),
			).toHaveCount(0);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow, path).toBeLessThanOrEqual(0);

			await menu.click();
			await expect(
				page.getByRole("searchbox", { name: "Buscar vídeos" }).locator("visible=true"),
			).toHaveCount(1);
		}
		await context.close();
	});

	test("el pie lleva «El canal», «Esta web» y «Scaena es parte de jotis.me.»", async ({ page }) => {
		await page.goto("/");
		const footer = page.locator("footer");
		await expect(footer.getByText("El canal")).toBeVisible();
		await expect(footer.getByRole("link", { name: "Twitch" })).toHaveAttribute(
			"href",
			"https://twitch.tv/jotis_1",
		);
		await expect(footer.getByRole("link", { name: "YouTube" })).toBeVisible();
		await expect(footer.getByText("Esta web")).toBeVisible();
		await expect(footer.getByRole("link", { name: "Vídeos" })).toHaveAttribute("href", "/videos");
		// Sin sesión, «Estudio» lleva a la entrada, como en la cabecera.
		await expect(footer.getByRole("link", { name: "Estudio" })).toHaveAttribute("href", "/studio/login");
		await expect(footer.getByText("Scaena es parte de jotis.me.")).toBeVisible();
	});

	test("el favicon es el icono sólido en SVG", async ({ page, request }) => {
		await page.goto("/");
		const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
		expect(href).toMatch(/favicon\.svg/);
		const res = await request.get(href ?? "");
		expect(res.headers()["content-type"]).toMatch(/image\/svg\+xml/);
		expect(await res.text()).toContain("<svg");
	});
});

test.describe("portada", () => {
	test("sin directo: las tres secciones en orden, la franja junto al estado y la escena offline", async ({
		page,
	}) => {
		await page.goto("/");
		// Los encabezados que lee el lector de pantalla: los de las escenas de muestra van ocultos.
		const headings = await page
			.locator("main")
			.getByRole("heading")
			.evaluateAll((els) => els.filter((e) => /^H[12]$/.test(e.tagName)).map((e) => e.textContent));
		expect(headings).toEqual([
			"Juegos a mi ritmo, sin prisa.",
			"Cómo va un directo",
			"Lo último en YouTube",
		]);
		const hero = page.locator("#schedule");
		await expect(hero.getByRole("status").getByText("Sin directo", { exact: true })).toBeVisible();
		await expect(hero.getByText("Suele haber directo de 17:00 a 20:00.")).toBeVisible();
		await expect(hero.getByRole("link", { name: "Ver en Twitch" })).toHaveAttribute(
			"href",
			"https://twitch.tv/jotis_1",
		);
		await expect(hero.getByRole("link", { name: "Ver los vídeos" })).toHaveAttribute("href", "/videos");
		// El marco enseña la escena offline del perfil.
		await expect(hero.getByText("Ahora no estoy")).toBeAttached();
		// Tres vídeos, con su línea.
		const latest = page.locator('section[aria-labelledby="ultimo"]');
		await expect(latest.locator('a[href^="/videos?v="]')).toHaveCount(3);
		await expect(latest.getByText("Directo resubido. Cyberpunk 2077 #1, 1:02:05")).toBeVisible();
	});

	test("en directo: estado con tiempo y categoría, «Entrar al directo» y la escena de juego", async ({
		page,
	}) => {
		await seed(LIVE);
		await page.route("**/api/status**", (r) => r.fulfill({ json: LIVE }));
		await page.goto("/");
		const hero = page.locator("#schedule");
		await expect(hero.getByText("Elden Ring").first()).toBeVisible();
		await expect(hero.getByText("Suele haber directo")).toHaveCount(0);
		await expect(hero.getByRole("link", { name: "Entrar al directo" })).toBeVisible();
		await expect(hero.getByText("Ahora no estoy")).toHaveCount(0);
	});

	test("los pasos: «La charla», el siguiente y volver al principio", async ({ page }) => {
		await page.goto("/");
		const journey = page.locator('section[aria-labelledby="como-va"]');
		await expect(journey.getByRole("heading", { name: "Aviso y cuenta atrás" })).toBeVisible();
		await journey.getByRole("button", { name: "La charla", exact: true }).click();
		await expect(journey.getByRole("heading", { name: "Just Chatting, de lo que surja" })).toBeVisible();
		await expect(journey.locator('[aria-live="polite"]').first()).toContainText(
			"Just Chatting, de lo que surja",
		);
		await journey.getByRole("button", { name: "Siguiente: después" }).click();
		await expect(journey.getByRole("heading", { name: "El directo se queda en YouTube" })).toBeVisible();
		await journey.getByRole("button", { name: "Volver al principio" }).click();
		await expect(journey.getByRole("heading", { name: "Aviso y cuenta atrás" })).toBeVisible();
	});

	test("Discord, sin enlace, no aparece en el pie ni en el paso «Después»", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Después", exact: true }).click();
		await expect(page.getByRole("heading", { name: "El directo se queda en YouTube" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Entrar en Discord" })).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Discord" })).toHaveCount(0);
		await expect(
			page.locator("footer").getByRole("link", { name: "YouTube", exact: true }),
		).toBeVisible();
	});

	for (const scheme of ["light", "dark"] as const)
		for (const live of [false, true])
			test(`axe sin errores y como mucho un botón principal (${scheme}${live ? ", en directo" : ""})`, async ({
				browser,
			}) => {
				if (live) await seed(LIVE);
				const context = await browser.newContext({ colorScheme: scheme });
				const page = await context.newPage();
				if (live) await page.route("**/api/status**", (r) => r.fulfill({ json: LIVE }));
				await page.goto("/");
				await expect(page.getByText("Lo último en YouTube")).toBeVisible();
				// Los botones de `ProgressSteps` llevan el título como nombre y la línea de apoyo como descripción
				// (`aria-describedby`); axe compara el nombre con todo el texto visible y los marca. Se revisan
				// aparte, con todas las reglas menos esa.
				const steps = 'ol[aria-label="Cómo va un directo"] button';
				const page1 = await new AxeBuilder({ page }).exclude(steps).analyze();
				const page2 = await new AxeBuilder({ page })
					.include(steps)
					.disableRules(["label-content-name-mismatch"])
					.analyze();
				const violations = [...page1.violations, ...page2.violations];
				expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual(
					[],
				);
				expect(await primaries(page).count()).toBeLessThanOrEqual(1);
				await context.close();
			});

	test("el foco no entra en las escenas de muestra y recorre las secciones en orden", async ({ page }) => {
		await page.goto("/");
		const ZONES = [
			"header",
			"#schedule",
			'section[aria-labelledby="como-va"]',
			'section[aria-labelledby="ultimo"]',
			"footer",
		];
		const zones: number[] = [];
		for (let i = 0; i < 60; i++) {
			await page.keyboard.press("Tab");
			const stop = await page.evaluate((zs) => {
				const el = document.activeElement as HTMLElement;
				return {
					inScene: Boolean(el.closest("[inert], [aria-hidden='true']")),
					zone: zs.findIndex((z) => el.closest(z)),
				};
			}, ZONES);
			expect(stop.inScene).toBe(false);
			// Al acabar el pie, el foco vuelve a la barra del navegador: ahí se para.
			if (zones.length && stop.zone < zones[zones.length - 1]) break;
			if (stop.zone >= 0) zones.push(stop.zone);
		}
		// Cabecera, qué es, los pasos, los vídeos y el pie, en ese orden y sin saltarse ninguno.
		expect([...new Set(zones)]).toEqual([0, 1, 2, 3, 4]);
	});

	// design.md, decisión 5: el marco ocupa su media columna, hasta 640 px.
	const heroFrame = (page: Page) => page.locator('#schedule [class*="flex-[1_1_480px]"] > *').first();

	test("a 1440 px el marco de la primera sección mide al menos 560 px", async ({ browser }) => {
		const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
		const page = await context.newPage();
		for (const status of [{ live: false }, LIVE]) {
			await seed(status);
			await page.goto("/");
			const box = await heroFrame(page).boundingBox();
			expect(box?.width, JSON.stringify(status)).toBeGreaterThanOrEqual(560);
			expect(box?.width).toBeLessThanOrEqual(640);
		}
		await context.close();
	});

	test("a 390 px el marco ocupa el ancho y no hay desplazamiento horizontal", async ({ browser }) => {
		const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
		const page = await context.newPage();
		await page.goto("/");
		const box = await heroFrame(page).boundingBox();
		// Todo el ancho menos los 16 px de margen a cada lado.
		expect(box?.width).toBeGreaterThanOrEqual(390 - 2 * 16 - 1);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
		await context.close();
	});

	test("en móvil la escena de los pasos cabe sin desplazamiento horizontal", async ({ browser }) => {
		const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
		const page = await context.newPage();
		await page.goto("/");
		for (const step of ["Antes", "La partida", "La charla", "Después"]) {
			await page.getByRole("button", { name: step, exact: true }).click();
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow, step).toBeLessThanOrEqual(0);
		}
		await context.close();
	});
});

test.describe("aviso de directo", () => {
	async function controlStatus(page: Page) {
		let current: object = { live: false };
		await page.clock.install();
		await page.route("**/api/status**", (r) => r.fulfill({ json: current }));
		return (s: object) => {
			current = s;
		};
	}

	test("aparece y se va sin recargar cuando cambia el estado", async ({ page }) => {
		const set = await controlStatus(page);
		await page.goto("/");
		const banner = page.getByLabel("En directo ahora", { exact: true });
		await expect(banner).toHaveCount(0);
		set(LIVE);
		await page.clock.fastForward(30_000);
		await expect(banner).toBeVisible();
		await expect(banner).toContainText("En directo: Elden Ring sin prisa");
		await expect(banner).toContainText(/Elden Ring, 2:1\d:\d\d en emisión/);
		await expect(banner).not.toContainText("espectadores");
		await expect(banner.getByRole("link", { name: "Ver en Twitch" })).toHaveAttribute(
			"href",
			"https://twitch.tv/jotis_1",
		);
		await expect(banner.getByRole("link", { name: "scaena.jotis.me/live" })).toHaveCount(0);
		set({ live: false });
		await page.clock.fastForward(30_000);
		await expect(banner).toHaveCount(0);
	});

	test("cerrado no vuelve en la visita, y la portada sigue en directo", async ({ page }) => {
		await seed(LIVE);
		await page.route("**/api/status**", (r) => r.fulfill({ json: LIVE }));
		await page.goto("/");
		const banner = page.getByLabel("En directo ahora", { exact: true });
		await expect(banner).toBeVisible();
		await banner.getByRole("button", { name: "Cerrar el aviso" }).click();
		await expect(banner).toHaveCount(0);
		await page.reload();
		await expect(page.getByText("Lo último en YouTube")).toBeVisible();
		await expect(banner).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Entrar al directo" })).toBeVisible();
	});

	test("en directo: sin tokens de error y como mucho un botón principal", async ({ page }) => {
		await seed(LIVE);
		await page.route("**/api/status**", (r) => r.fulfill({ json: LIVE }));
		await page.goto("/");
		const banner = page.getByLabel("En directo ahora", { exact: true });
		await expect(banner).toBeVisible();
		const classes = await banner.evaluate((el) =>
			[el, ...el.querySelectorAll("*")].map((n) => n.getAttribute("class") ?? "").join(" "),
		);
		expect(classes).not.toMatch(/error/);
		expect(await primaries(page).count()).toBeLessThanOrEqual(1);
	});
});

test.describe("/live", () => {
	test("sin directo lleva al horario de la portada", async ({ page }) => {
		await page.goto("/live");
		await expect(page).toHaveURL(/\/#schedule$/);
		await expect(page.getByText("Suele haber directo de 17:00 a 20:00.")).toBeInViewport();
	});

	test("en directo redirige a Twitch", async ({ request }) => {
		await seed(LIVE);
		const res = await request.get("/live", { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers().location).toBe("https://www.twitch.tv/jotis_1");
	});
});

test.describe("metadatos para compartir", () => {
	test("la portada lleva título, descripción corta y el banner en las etiquetas `og:`", async ({
		page,
		request,
	}) => {
		await page.goto("/");
		const og = async (p: string) => page.locator(`meta[property="og:${p}"]`).getAttribute("content");
		expect(await og("title")).toBe("Scaena · Jotis");
		expect(await og("description")).toBe("Juegos a mi ritmo, sin prisa.");
		expect(await og("image:width")).toBe("1200");
		expect(await og("image:height")).toBe("480");
		const image = await og("image");
		expect(image).toMatch(/\/banner\.png$/);
		const res = await request.get(new URL(image ?? "").pathname);
		expect(res.headers()["content-type"]).toBe("image/png");
		await expect(page).toHaveTitle("Scaena · Jotis");
	});

	test("cada página tiene los suyos", async ({ page }) => {
		await page.goto("/videos");
		await expect(page).toHaveTitle("Vídeos · Scaena");
		expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toBe(
			"Vídeos · Scaena",
		);
		expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(
			/\/banner\.png$/,
		);
	});
});
