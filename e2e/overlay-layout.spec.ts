import { expect, test } from "@playwright/test";

const URL = "/overlay/jotis_1/camera";

test.describe("layout de overlay", () => {
	test("la página es transparente", async ({ page }) => {
		await page.goto(URL);
		const bg = await page.evaluate(() => ({
			html: getComputedStyle(document.documentElement).backgroundColor,
			body: getComputedStyle(document.body).backgroundColor,
		}));
		expect(bg).toEqual({ html: "rgba(0, 0, 0, 0)", body: "rgba(0, 0, 0, 0)" });
	});

	test("siempre en oscuro, aunque el sistema esté en claro", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto(URL);
		await expect(page.locator("html")).toHaveClass(/dark-mode/);
		await context.close();
	});

	test("sin márgenes ni desplazamiento", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto(URL);
		const box = await page.evaluate(() => ({
			margin: getComputedStyle(document.body).margin,
			overflow: getComputedStyle(document.body).overflow,
		}));
		expect(box).toEqual({ margin: "0px", overflow: "hidden" });
	});

	test("OBS no la cachea", async ({ request }) => {
		const res = await request.get(URL);
		expect(res.headers()["cache-control"]).toBe("no-store");
	});
});
