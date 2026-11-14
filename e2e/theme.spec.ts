import { expect, type Page, test } from "@playwright/test";

// La clase se lee en cuanto existe el DOM, antes de que React hidrate: es lo que ve el primer fotograma.
async function darkAtFirstPaint(page: Page) {
	await page.goto("/", { waitUntil: "commit" });
	await page.waitForFunction(() => document.body !== null);
	return page.evaluate(() => document.documentElement.classList.contains("dark-mode"));
}

// El selector de la cabecera: con `mobileActions` se pinta dos veces y se usa el que se ve.
const themeButton = (page: Page) =>
	page
		.locator("header")
		.first()
		.getByRole("button", { name: /^Tema: / })
		.locator("visible=true");

async function chooseTheme(page: Page, option: "Claro" | "Oscuro" | "Sistema") {
	await themeButton(page).click();
	await page.getByRole("menuitemradio", { name: option }).click();
}

// Caja de cada elemento con foco de la cabecera, para ver que nada se mueve al cambiar de tema.
const headerBoxes = (page: Page) =>
	page
		.locator("header")
		.first()
		.locator("a:visible, button:visible")
		.evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
			}),
		);

// specs/channel-site, «Claro y oscuro».
test.describe("selector de tema", () => {
	test("primera visita con el sistema en oscuro: oscuro desde el primer fotograma y marca «Sistema»", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		expect(await darkAtFirstPaint(page)).toBe(true);
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Sistema");
		await themeButton(page).click();
		await expect(page.getByRole("menuitemradio", { name: "Sistema" })).toBeChecked();
		await expect(page.getByRole("menuitemradio", { name: "Oscuro" })).not.toBeChecked();
		await context.close();
	});

	test("cambiar de tema: pasa a oscuro sin recargar y nada de la cabecera cambia de sitio", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto("/");
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Sistema");
		await page.evaluate(() => {
			(window as unknown as { marker: boolean }).marker = true;
		});
		const before = await headerBoxes(page);
		const triggerBefore = await themeButton(page).boundingBox();

		await chooseTheme(page, "Oscuro");
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Oscuro");
		await expect(page.getByRole("menu")).toHaveCount(0);
		expect(await themeButton(page).boundingBox()).toEqual(triggerBefore);
		expect(await headerBoxes(page)).toEqual(before);
		// Misma página: no ha recargado.
		expect(await page.evaluate(() => (window as unknown as { marker?: boolean }).marker)).toBe(true);

		await chooseTheme(page, "Claro");
		await expect(page.locator("html")).not.toHaveClass(/dark-mode/);
		expect(await themeButton(page).boundingBox()).toEqual(triggerBefore);
		await context.close();
	});

	test("elección recordada: «Claro» manda al volver aunque el sistema esté en oscuro", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto("/");
		await chooseTheme(page, "Claro");
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Claro");
		await page.close();

		const again = await context.newPage();
		await again.emulateMedia({ colorScheme: "dark" });
		expect(await darkAtFirstPaint(again)).toBe(false);
		await expect(themeButton(again)).toHaveAccessibleName("Tema: Claro");
		await context.close();
	});

	test("volver a seguir al sistema: con «Claro» guardado, «Sistema» pasa a oscuro y sigue así al volver", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		await context.addInitScript(() => {
			if (!sessionStorage.getItem("seeded")) {
				localStorage.setItem("theme", "light");
				sessionStorage.setItem("seeded", "1");
			}
		});
		const page = await context.newPage();
		await page.goto("/");
		await expect(page.locator("html")).not.toHaveClass(/dark-mode/);
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Claro");

		await chooseTheme(page, "Sistema");
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();

		expect(await darkAtFirstPaint(page)).toBe(true);
		await expect(themeButton(page)).toHaveAccessibleName("Tema: Sistema");
		// Sigue al sistema: si cambia con la web abierta, cambia con él.
		await page.emulateMedia({ colorScheme: "light" });
		await expect(page.locator("html")).not.toHaveClass(/dark-mode/);
		await context.close();
	});
});

test.describe("tema de la web", () => {
	test("sin elección y con el sistema en oscuro, el primer fotograma ya es oscuro", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		expect(await darkAtFirstPaint(page)).toBe(true);
		await context.close();
	});

	test("sin elección y con el sistema en claro, la web es clara", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		expect(await darkAtFirstPaint(page)).toBe(false);
		await context.close();
	});

	test("una elección guardada manda sobre el sistema", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		await context.addInitScript(() => localStorage.setItem("theme", "light"));
		const page = await context.newPage();
		expect(await darkAtFirstPaint(page)).toBe(false);
		await context.close();
	});

	test("sin elección, sigue al sistema si cambia con la web abierta", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto("/");
		await page.emulateMedia({ colorScheme: "dark" });
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		await context.close();
	});

	test("los tokens oscuros se aplican al fondo", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		await page.goto("/");
		const light = await browser.newContext({ colorScheme: "light" });
		const lightPage = await light.newPage();
		await lightPage.goto("/");
		const bg = (p: typeof page) => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(await bg(page)).not.toBe(await bg(lightPage));
		await context.close();
		await light.close();
	});
});
