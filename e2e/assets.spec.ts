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
		await expect(page.getByRole("article", { name: `Panel ${p.title}` })).toBeVisible();
	await expect(page.getByRole("article", { name: "Banner" })).toBeVisible();
	// Cada pieza enseña el nombre de su archivo.
	await expect(
		page.getByRole("article", { name: "Panel Normas" }).getByText("panel-normas.png"),
	).toBeVisible();
	// El panel con acción enseña su enlace para copiarlo en Twitch.
	await expect(
		page.getByRole("article", { name: "Panel Vídeos" }).getByLabel("Enlace del panel"),
	).toHaveValue("https://www.youtube.com/@jotis_1");
});

test("`panel-normas.png` mide 640 px de ancho y `banner.png`, 1200×480", async ({ page }) => {
	await page.goto("/studio/assets");
	const normas = await download(page, () =>
		page
			.getByRole("article", { name: "Panel Normas" })
			.getByRole("button", { name: "Descargar el panel Normas" })
			.click(),
	);
	expect(normas.name).toBe("panel-normas.png");
	expect(PNG.sync.read(normas.bytes).width).toBe(640);

	const banner = await download(page, () =>
		page
			.getByRole("article", { name: "Banner" })
			.getByRole("button", { name: "Descargar banner" })
			.click(),
	);
	expect(banner.name).toBe("banner.png");
	const b = PNG.sync.read(banner.bytes);
	expect([b.width, b.height]).toEqual([1200, 480]);
});

test("«Descargar todo (.zip)» trae todos los PNG en un .zip", async ({ page }) => {
	await page.goto("/studio/assets");
	const zip = await download(page, () =>
		page.getByRole("button", { name: "Descargar todo (.zip)" }).click(),
	);
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
			(await download(page, () => page.getByRole("button", { name: "Descargar todo (.zip)" }).click()))
				.bytes,
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

// specs/twitch-profile-assets, «Editar el contenido de los recursos»; specs/channel-profile, «Contenido del canal en un
// solo sitio». Cada prueba deja el perfil como estaba.
test.describe("contenido del canal", () => {
	test.afterEach(async ({ page }) => {
		await page.request.delete("/api/studio/profile");
	});
	const editor = (page: Page) => page.getByRole("region", { name: "Contenido del canal" });

	test("cambiar la tercera norma: la vista previa la enseña al momento y, guardada, al recargar", async ({
		page,
	}) => {
		await page.goto("/studio/assets");
		await editor(page).getByRole("button", { name: "Normas", exact: true }).click();
		await editor(page).getByRole("textbox", { name: "Norma 3" }).fill("Nada de spoilers sin aviso.");
		const panel = page.getByRole("article", { name: "Panel Normas" });
		await expect(panel).toContainText("3. Nada de spoilers sin aviso.");
		await editor(page).getByRole("button", { name: "Guardar contenido" }).click();
		await expect(editor(page).getByText(/^Guardado\./)).toBeVisible();
		await page.reload();
		await expect(page.getByRole("article", { name: "Panel Normas" })).toContainText(
			"3. Nada de spoilers sin aviso.",
		);
	});

	test("el horario guardado llega a la portada", async ({ page }) => {
		await page.goto("/studio/assets");
		await editor(page).getByRole("button", { name: "Horario", exact: true }).click();
		await editor(page).getByLabel("Empieza").fill("18:00");
		await editor(page).getByLabel("Acaba").fill("21:00");
		await editor(page).getByRole("button", { name: "Guardar contenido" }).click();
		await expect(editor(page).getByText(/^Guardado\./)).toBeVisible();
		await page.goto("/");
		await expect(page.getByText("Suele haber directo de 18:00 a 21:00.").first()).toBeVisible();
	});

	test("una norma con emoji no se guarda y el error sale en su campo", async ({ page }) => {
		await page.goto("/studio/assets");
		await editor(page).getByRole("button", { name: "Normas", exact: true }).click();
		await editor(page).getByRole("textbox", { name: "Norma 1" }).fill("Buen rollo 🎉");
		await editor(page).getByRole("button", { name: "Guardar contenido" }).click();
		await expect(editor(page).getByText(/emoji/).first()).toBeVisible();
		await expect(
			editor(page).getByText("No se ha guardado: mira el mensaje debajo de cada campo."),
		).toBeVisible();
		const res = await page.request.put("/api/studio/profile", { data: { edits: {} } });
		expect((await res.json()).profile.rules[0]).not.toContain("🎉");
	});

	test("volver a los valores por defecto deja el perfil como al principio", async ({ page }) => {
		await page.goto("/studio/assets");
		const original = await page.getByRole("article", { name: "Panel Normas" }).textContent();
		await editor(page).getByRole("button", { name: "Normas", exact: true }).click();
		await editor(page).getByRole("textbox", { name: "Norma 1" }).fill("Otra norma.");
		await editor(page).getByRole("button", { name: "Guardar contenido" }).click();
		await expect(editor(page).getByText(/^Guardado\./)).toBeVisible();
		await editor(page).getByRole("button", { name: "Volver a los valores por defecto" }).click();
		await page.getByRole("dialog").getByRole("button", { name: "Volver a los de por defecto" }).click();
		await expect(editor(page).getByText("Vuelve a estar con los valores por defecto.")).toBeVisible();
		await page.reload();
		expect(await page.getByRole("article", { name: "Panel Normas" }).textContent()).toBe(original);
	});
});
