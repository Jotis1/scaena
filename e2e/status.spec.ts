import { expect, type Page, test } from "@playwright/test";

// specs/live-status, «Overlay de estado», contra un `/api/status` simulado.
const LIVE = {
	live: true,
	title: "Elden Ring sin prisa",
	category: "Elden Ring",
	viewers: 1284,
	startedAt: new Date(Date.now() - (2 * 3600 + 14 * 60) * 1000).toISOString(),
};

async function fakeStatus(page: Page, body: object) {
	await page.route("**/api/status**", (r) => r.fulfill({ json: body }));
}

test("por defecto no aparece la cifra de espectadores", async ({ page }) => {
	await fakeStatus(page, LIVE);
	await page.goto("/overlay/jotis1/status");
	const pill = page.getByRole("status");
	await expect(pill).toContainText("En directo");
	await expect(pill).toContainText("Elden Ring");
	await expect(pill).toContainText(/2:14:\d\d/);
	await expect(pill).not.toContainText("1.284");
});

test("con `viewers=1` enseña los espectadores en formato español", async ({ page }) => {
	await fakeStatus(page, LIVE);
	await page.goto("/overlay/jotis1/status?viewers=1");
	await expect(page.getByRole("status")).toContainText("1.284");
});

test("sin directo dice offline y el fondo sigue transparente", async ({ page }) => {
	await fakeStatus(page, { live: false });
	await page.goto("/overlay/jotis1/status");
	await expect(page.getByRole("status")).toBeVisible();
	await expect(page.getByRole("status")).not.toContainText("En directo");
	expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
		"rgba(0, 0, 0, 0)",
	);
});
