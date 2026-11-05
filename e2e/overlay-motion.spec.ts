import { expect, type Page, test } from "@playwright/test";

// specs/obs-overlays, «Movimiento según la guía» y «Siempre en oscuro».
// Las clases de entrada y salida son las de Regula (`streamMotion` de @jotis-me/react). Se prueban sobre el CSS
// real de un overlay; cuando estén las alertas (tarea 6.10), su test repite esto sobre la pieza.
const ENTER =
	"transition-[opacity,translate] duration-250 ease-[cubic-bezier(.2,.7,.2,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-opacity motion-reduce:starting:translate-y-0";
const EXIT =
	"-translate-y-2 opacity-0 transition-[opacity,translate] duration-200 ease-in motion-reduce:translate-y-0 motion-reduce:transition-opacity";

async function transitionOf(page: Page, classes: string) {
	return page.evaluate((c) => {
		const el = document.createElement("div");
		el.className = c;
		document.body.append(el);
		const s = getComputedStyle(el);
		return { property: s.transitionProperty, offset: s.translate };
	}, classes);
}

test.describe("movimiento", () => {
	test("normal: entra y sale con fundido y 8px de desplazamiento", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await page.goto("/overlay/jotis_1/camera");
		expect((await transitionOf(page, ENTER)).property).toBe("opacity, translate");
		expect(await transitionOf(page, EXIT)).toEqual({
			property: "opacity, translate",
			offset: "0px -8px",
		});
	});

	test("con menos movimiento, solo cambia la opacidad", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/overlay/jotis_1/camera");
		expect((await transitionOf(page, ENTER)).property).toBe("opacity");
		expect(await transitionOf(page, EXIT)).toEqual({ property: "opacity", offset: "0px" });
	});
});

test.describe("siempre en oscuro", () => {
	for (const path of [
		"/overlay/jotis_1/camera",
		"/overlay/jotis_1/scene/starting",
		"/overlay/jotis_1/scene/offline",
	]) {
		test(`${path}, con el sistema en claro`, async ({ browser }) => {
			const context = await browser.newContext({ colorScheme: "light" });
			const page = await context.newPage();
			await page.goto(path);
			await expect(page.locator("html")).toHaveClass(/dark-mode/);
			// El texto principal sale con los tokens oscuros: claro sobre oscuro.
			const color = await page.evaluate(() => getComputedStyle(document.body).color);
			const [r, g, b] = (color.match(/\d+/g) ?? []).map(Number);
			expect((r + g + b) / 3).toBeGreaterThan(200);
			await context.close();
		});
	}
});
