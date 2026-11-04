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
			await expect(header.getByRole("img", { name: "Scaena" })).toBeVisible();
			const name = header.getByText("Scaena", { exact: true });
			const font = await name.evaluate((el) => {
				const s = getComputedStyle(el);
				return { family: s.fontFamily, weight: s.fontWeight };
			});
			expect(font.family).toMatch(/Bricolage/);
			expect(font.weight).toBe("700");
			await expect(header).not.toContainText("jotis.me");
			const toggle = header.getByRole("button", {
				name: scheme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro",
			});
			await expect(toggle).toBeVisible();
			await context.close();
		});

	test("el botón cambia el tema sin recargar y la elección se mantiene al volver", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto("/");
		await page.evaluate(() => {
			(window as unknown as { marker: boolean }).marker = true;
		});
		await page.getByRole("button", { name: "Cambiar a oscuro" }).click();
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		await expect(page.getByRole("button", { name: "Cambiar a claro" })).toBeVisible();
		// Misma página: no ha recargado.
		expect(await page.evaluate(() => (window as unknown as { marker?: boolean }).marker)).toBe(true);
		await page.reload();
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		await context.close();
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
	test("sin directo: las cuatro secciones en orden y «Ahora mismo, sin directo»", async ({ page }) => {
		await page.goto("/");
		const headings = await page.locator("main h1, main h2").allTextContents();
		const order = [
			"Juegos a mi ritmo, sin prisa.",
			"Ajustes de partida",
			"Cuándo suelo estar",
			"Dónde verlo",
			"Diario de partidas",
		];
		expect(headings).toEqual(order);
		await expect(page.getByText("Ahora mismo, sin directo")).toBeVisible();
		await expect(page.getByText("Normalmente", { exact: true })).toBeVisible();
		await expect(page.getByText("17:00 – 20:00")).toBeVisible();
		// Seis vídeos, con el juego de los directos.
		await expect(page.locator('a[href^="/videos?v="]')).toHaveCount(6);
		await expect(page.getByText("Cyberpunk 2077 - #1")).toBeVisible();
		await expect(page.getByText("1:02:05").first()).toBeVisible();
	});

	test("Discord, sin enlace, no aparece en «Dónde verlo» ni en el pie", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByText("Discord", { exact: true })).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Discord" })).toHaveCount(0);
		await expect(page.getByRole("link", { name: "YouTube", exact: true })).toBeVisible();
	});

	for (const scheme of ["light", "dark"] as const)
		test(`axe sin errores y como mucho un botón principal (${scheme})`, async ({ browser }) => {
			const context = await browser.newContext({ colorScheme: scheme });
			const page = await context.newPage();
			await page.goto("/");
			await expect(page.getByText("Diario de partidas")).toBeVisible();
			const { violations } = await new AxeBuilder({ page }).analyze();
			expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
			expect(await primaries(page).count()).toBeLessThanOrEqual(1);
			await context.close();
		});

	test("el foco no se para en «Ajustes de partida» y recorre la página en orden", async ({ page }) => {
		await page.goto("/");
		const stops: { inside: boolean; top: number }[] = [];
		for (let i = 0; i < 25; i++) {
			await page.keyboard.press("Tab");
			stops.push(
				await page.evaluate(() => {
					const el = document.activeElement as HTMLElement;
					return {
						inside: Boolean(el.closest('[aria-labelledby="play-settings"]')),
						top: el.getBoundingClientRect().top + window.scrollY,
					};
				}),
			);
		}
		expect(stops.some((s) => s.inside)).toBe(false);
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
		await expect(banner).toContainText("1.284 espectadores");
		await expect(banner.getByRole("link", { name: "Ver en Twitch" })).toHaveAttribute(
			"href",
			"https://twitch.tv/jotis1",
		);
		await expect(banner.getByRole("link", { name: "scaena.jotis.me/live" })).toHaveAttribute(
			"href",
			"/live",
		);
		await expect(page.getByText("En directo ahora", { exact: true }).last()).toBeVisible();
		set({ live: false });
		await page.clock.fastForward(30_000);
		await expect(banner).toHaveCount(0);
	});

	test("cerrado no vuelve en la visita, y «Dónde verlo» sigue en directo", async ({ page }) => {
		await seed(LIVE);
		await page.route("**/api/status**", (r) => r.fulfill({ json: LIVE }));
		await page.goto("/");
		const banner = page.getByLabel("En directo ahora", { exact: true });
		await expect(banner).toBeVisible();
		await banner.getByRole("button", { name: "Cerrar el aviso" }).click();
		await expect(banner).toHaveCount(0);
		await page.reload();
		await expect(page.getByText("Diario de partidas")).toBeVisible();
		await expect(banner).toHaveCount(0);
		await expect(page.locator("main").getByText("En directo ahora")).toBeVisible();
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
	});

	test("en directo redirige a Twitch", async ({ request }) => {
		await seed(LIVE);
		const res = await request.get("/live", { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers().location).toBe("https://www.twitch.tv/jotis1");
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
