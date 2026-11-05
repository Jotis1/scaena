import { expect, type Page, test } from "@playwright/test";

const URL = "/overlay/jotis_1/camera";

/** El marco es el primer `div` visible del `body`; su interior es lo que no tapa la etiqueta. */
async function frame(page: Page) {
	return page.evaluate(() => {
		const el = document.body.querySelector(":scope > div:not([hidden])") as HTMLElement;
		const r = el.getBoundingClientRect();
		// El centro del marco queda lejos de la etiqueta (abajo a la izquierda): lo que se ve ahí es el interior.
		const center = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 3) as HTMLElement;
		return {
			width: Math.round(r.width),
			height: Math.round(r.height),
			frameBackground: getComputedStyle(el).backgroundColor,
			centerBackground: getComputedStyle(center).backgroundColor,
			centerIsFrameOrBody:
				center === el || center === document.body || center === document.documentElement,
		};
	});
}

test("el interior del marco es transparente", async ({ page }) => {
	await page.goto(URL);
	const f = await frame(page);
	expect(f.frameBackground).toBe("rgba(0, 0, 0, 0)");
	expect(f.centerBackground).toBe("rgba(0, 0, 0, 0)");
	expect(f.centerIsFrameOrBody).toBe(true);
});

test("por defecto: 16:9 a 480, en directo y con el nombre del perfil", async ({ page }) => {
	await page.goto(URL);
	expect(await frame(page)).toMatchObject({ width: 480, height: 270 });
	await expect(page.getByText("En directo")).toBeVisible();
	await expect(page.getByText("Jotis", { exact: true })).toBeVisible();
});

test("las opciones de la URL cambian proporción, ancho, nombre, rol y estado", async ({ page }) => {
	await page.goto(`${URL}?ratio=4:3&width=640&name=Juan&role=${encodeURIComponent("él/ella")}&live=0`);
	expect(await frame(page)).toMatchObject({ width: 640, height: 480 });
	await expect(page.getByText("Juan", { exact: true })).toBeVisible();
	await expect(page.getByText("él/ella")).toBeVisible();
	await expect(page.getByText("En directo")).toHaveCount(0);
});

test("opciones mal escritas caen al valor por defecto", async ({ page }) => {
	await page.goto(`${URL}?ratio=21:9&width=enorme&live=quizas`);
	expect(await frame(page)).toMatchObject({ width: 480, height: 270 });
	await expect(page.getByText("En directo")).toBeVisible();
});
