import { expect, test } from "@playwright/test";

// La clase se lee en cuanto existe el DOM, antes de que React hidrate: es lo que ve el primer fotograma.
async function darkAtFirstPaint(page: import("@playwright/test").Page) {
	await page.goto("/", { waitUntil: "commit" });
	await page.waitForFunction(() => document.body !== null);
	return page.evaluate(() => document.documentElement.classList.contains("dark-mode"));
}

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
