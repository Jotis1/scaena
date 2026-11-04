import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CHANNEL_ID, redis, seedChannel, setJson } from "./redis";

// specs/channel-site, «Página de vídeos», con la lista en el Redis falso.
test.describe.configure({ mode: "serial" });

// 30 vídeos: los impares, directos resubidos; los pares, editados. El primero, del 29 oct 2026.
const VIDEOS = Array.from({ length: 30 }, (_, i) => {
	const n = i + 1;
	return {
		id: `vid${n}`,
		title: n % 2 ? `Parte ${n} - Cyberpunk 2077 #${n}` : `Resumen ${n}`,
		publishedAt: new Date(Date.UTC(2026, 9, 29 - i, 19)).toISOString(),
		thumbnail: `https://i.ytimg.com/vi/vid${n}/maxresdefault.jpg`,
		duration: 11560,
	};
});

async function seed(videos: object[] | null) {
	await redis("FLUSHALL");
	await seedChannel();
	await setJson(`channel:${CHANNEL_ID}:status`, { live: false });
	if (videos) await setJson(`channel:${CHANNEL_ID}:youtube`, { videos, fetchedAt: Date.now() });
}

const YOUTUBE = /youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com/;

test.beforeEach(() => seed(VIDEOS));

test("no se pide nada a YouTube hasta pulsar reproducir", async ({ page }) => {
	const requests: string[] = [];
	page.on("request", (r) => {
		if (YOUTUBE.test(new URL(r.url()).hostname)) requests.push(r.url());
	});
	await page.goto("/videos");
	await expect(page.getByRole("heading", { name: "Parte 1" })).toBeVisible();
	await page.waitForLoadState("networkidle");
	expect(requests).toEqual([]);
	await expect(page.locator("iframe")).toHaveCount(0);

	await page.getByRole("button", { name: "Reproducir «Parte 1»" }).click();
	const frame = page.locator("iframe");
	await expect(frame).toHaveAttribute(
		"src",
		/^https:\/\/www\.youtube-nocookie\.com\/embed\/vid1\?autoplay=1/,
	);
});

test("el vídeo en reproducción lleva tipo, juego, duración, fecha y «Abrir en YouTube»", async ({ page }) => {
	await page.goto("/videos");
	const now = page.getByRole("region", { name: "Reproduciendo" });
	await expect(now.getByText("Directo resubido")).toBeVisible();
	await expect(now.getByText("Cyberpunk 2077 - #1 - 3:12:40 - 29 oct 2026")).toBeVisible();
	await expect(now.getByRole("link", { name: "Abrir en YouTube" })).toHaveAttribute(
		"href",
		"https://www.youtube.com/watch?v=vid1",
	);
});

test("pulsar una tarjeta la pone arriba, en la URL, y empieza a reproducirse", async ({ page }) => {
	await page.goto("/videos");
	await page.getByRole("link", { name: /Resumen 2/ }).click();
	await expect(page).toHaveURL(/[?&]v=vid2/);
	await expect(page.getByRole("region", { name: "Reproduciendo" }).getByRole("heading")).toHaveText(
		"Resumen 2",
	);
	await expect(page.locator("iframe")).toHaveAttribute("src", /embed\/vid2\?autoplay=1/);
	await expect(page.getByRole("link", { name: /Resumen 2/ })).toContainText("Reproduciendo");
});

test("el filtro y la paginación cambian la URL y cuentan solo lo filtrado", async ({ page }) => {
	await page.goto("/videos");
	await expect(page.getByText("Página 1 de 3")).toBeVisible();
	await page.getByRole("tab", { name: "Directos" }).click();
	await expect(page).toHaveURL(/\/videos\?type=live$/);
	await expect(page.getByText("Página 1 de 2")).toBeVisible();
	await expect(page.getByText("Editado", { exact: true })).toHaveCount(0);
	await page.getByRole("link", { name: "Anteriores" }).click();
	await expect(page).toHaveURL(/\/videos\?type=live&page=2$/);
	await expect(page.locator('a[href^="/videos?"][href*="v=vid"]')).toHaveCount(3);
	await page.getByRole("link", { name: "Más recientes" }).click();
	await expect(page).toHaveURL(/\/videos\?type=live$/);
});

test("página 2 de todos: los vídeos 13 a 24", async ({ page }) => {
	await page.goto("/videos?page=2");
	const ids = await page
		.locator('a[href^="/videos?"][href*="v=vid"]')
		.evaluateAll((as) => as.map((a) => new URL((a as HTMLAnchorElement).href).searchParams.get("v")));
	expect(ids).toEqual(Array.from({ length: 12 }, (_, i) => `vid${i + 13}`));
});

test("el foco recorre la página en orden de lectura", async ({ page }) => {
	await page.goto("/videos");
	let last = -1;
	for (let i = 0; i < 30; i++) {
		await page.keyboard.press("Tab");
		const top = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement;
			if (el === document.body) return -1;
			return Math.round(el.getBoundingClientRect().top + window.scrollY);
		});
		if (top < 0) break;
		// Nunca vuelve hacia arriba. Margen de 12 px: en una fila centrada (la paginación), los elementos de distinta
		// altura no empiezan a la misma altura.
		expect(top).toBeGreaterThanOrEqual(last - 12);
		last = Math.max(last, top);
	}
});

test("axe sin errores y ningún botón principal con la lista cargada", async ({ page }) => {
	await page.goto("/videos");
	const { violations } = await new AxeBuilder({ page }).analyze();
	expect(violations.map((v) => v.id)).toEqual([]);
	expect(await page.locator("a.bg-brand-solid, button.bg-brand-solid").count()).toBe(0);
});

test("sin vídeos: estado vacío con enlace al canal", async ({ page }) => {
	await seed([]);
	await page.goto("/videos");
	await expect(page.getByText("Aún no hay vídeos")).toBeVisible();
	await expect(page.getByRole("link", { name: "Ver el canal en YouTube" })).toHaveAttribute(
		"href",
		"https://www.youtube.com/@jotis_1",
	);
	await expect(page.getByText("No se encontraron resultados")).toHaveCount(0);
});

test("YouTube caído y sin copia: «Reintentar» es el único principal y «Abrir YouTube», secundario", async ({
	page,
}) => {
	await seed(null);
	await page.goto("/videos");
	await expect(page.getByRole("alert").filter({ hasText: "YouTube no contesta" })).toBeVisible();
	const primary = page.locator("a.bg-brand-solid, button.bg-brand-solid");
	await expect(primary).toHaveCount(1);
	await expect(primary).toHaveText("Reintentar");
	await expect(page.getByRole("link", { name: "Abrir YouTube" })).not.toHaveClass(/bg-brand-solid/);
});
