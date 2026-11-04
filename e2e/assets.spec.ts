import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { unzipSync } from "fflate";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { parse } from "yaml";
import { redis, seedChannel } from "./redis";
import { createStudioUser, type StudioUser, signInAs } from "./session";

// specs/twitch-profile-assets: vista previa y exportación a PNG en el navegador (design.md, decisión 11).
test.describe.configure({ mode: "serial" });
// Pantalla 2x: así la captura de Chromium del mismo nodo sale al tamaño de la exportación de los paneles.
test.use({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } });

const profile = parse(readFileSync("content/channel.yaml", "utf8")) as {
	panels: { slug: string; title: string }[];
};
/** Píxeles distintos que se admiten entre la exportación y la captura de Chromium. */
const MAX_DIFF = 0.02;

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

async function download(page: Page, click: () => Promise<void>) {
	const wait = page.waitForEvent("download");
	await click();
	const d = await wait;
	const path = await d.path();
	return { name: d.suggestedFilename(), bytes: readFileSync(path) };
}

test("hay un panel por entrada del perfil y el banner", async ({ page }) => {
	await page.goto("/studio/assets");
	await expect(page.locator("[data-panel]")).toHaveCount(profile.panels.length);
	for (const p of profile.panels)
		await expect(page.getByRole("region", { name: `Panel ${p.title}` })).toBeVisible();
	await expect(page.getByRole("region", { name: "Banner" })).toBeVisible();
	// El panel con acción enseña su enlace para copiarlo en Twitch.
	await expect(
		page.getByRole("region", { name: "Panel Vídeos" }).getByLabel("Enlace del panel"),
	).toHaveValue("https://www.youtube.com/@jotis_1");
});

test("`panel-normas.png` mide 640 px de ancho y `banner.png`, 1200×480", async ({ page }) => {
	await page.goto("/studio/assets");
	const normas = await download(page, () =>
		page
			.getByRole("region", { name: "Panel Normas" })
			.getByRole("button", { name: "Exportar PNG" })
			.click(),
	);
	expect(normas.name).toBe("panel-normas.png");
	expect(PNG.sync.read(normas.bytes).width).toBe(640);

	const banner = await download(page, () =>
		page.getByRole("region", { name: "Banner" }).getByRole("button", { name: "Exportar PNG" }).click(),
	);
	expect(banner.name).toBe("banner.png");
	const b = PNG.sync.read(banner.bytes);
	expect([b.width, b.height]).toEqual([1200, 480]);
});

test("«Exportar todo» trae todos los PNG en un .zip", async ({ page }) => {
	await page.goto("/studio/assets");
	const zip = await download(page, () => page.getByRole("button", { name: "Exportar todo" }).click());
	expect(zip.name).toMatch(/\.zip$/);
	const files = unzipSync(new Uint8Array(zip.bytes));
	expect(Object.keys(files).sort()).toEqual(
		["banner.png", ...profile.panels.map((p) => `panel-${p.slug}.png`)].sort(),
	);
	for (const bytes of Object.values(files))
		expect(PNG.sync.read(Buffer.from(bytes)).width).toBeGreaterThan(0);
});

test("cada PNG se parece a la captura de Chromium del mismo nodo", async ({ page }) => {
	await page.goto("/studio/assets");
	await page.evaluate(() => document.fonts.ready);
	const files = unzipSync(
		new Uint8Array(
			(await download(page, () => page.getByRole("button", { name: "Exportar todo" }).click())).bytes,
		),
	);
	// Se traen las copias a la vista para que Chromium las pueda capturar.
	await page.locator("[data-export-nodes]").evaluate((el) => {
		// `absolute` y no `fixed`, para que lo que queda por debajo de la ventana se pueda desplazar a la vista.
		(el as HTMLElement).style.position = "absolute";
		(el as HTMLElement).style.left = "0px";
		(el as HTMLElement).style.zIndex = "1000";
	});
	for (const [name, bytes] of Object.entries(files)) {
		const node = page.locator(`[data-export="${name}"] > *`).first();
		await node.scrollIntoViewIfNeeded();
		let shot = PNG.sync.read(await node.screenshot({ omitBackground: true, animations: "disabled" }));
		const exported = PNG.sync.read(Buffer.from(bytes));
		// El banner se exporta a 1x: la captura a 2x se compara reducida.
		if (name === "banner.png")
			shot = PNG.sync.read(await node.screenshot({ omitBackground: true, scale: "css" }));
		expect([shot.width, shot.height], name).toEqual([exported.width, exported.height]);
		const diff = pixelmatch(shot.data, exported.data, undefined, shot.width, shot.height, {
			threshold: 0.2,
		});
		expect(diff / (shot.width * shot.height), name).toBeLessThan(MAX_DIFF);
	}
});
