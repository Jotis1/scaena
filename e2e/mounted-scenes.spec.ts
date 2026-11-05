import { expect, type Page, test } from "@playwright/test";
import { alert, fakeEvents, settings } from "./sse";

// specs/obs-overlays, «Escenas montadas» (design.md, decisión 15). Las posiciones son las del diseño aprobado.
test.use({ viewport: { width: 1920, height: 1080 } });

async function open(page: Page, path: string) {
	await page.route("**/api/status**", (r) =>
		r.fulfill({
			json: {
				live: true,
				title: "t",
				category: "Elden Ring",
				viewers: 10,
				startedAt: new Date().toISOString(),
			},
		}),
	);
	await fakeEvents(page, () => [
		settings(),
		alert({ type: "gift", user: "Ana", amount: 5 }),
		alert({ type: "follow", user: "Berta" }),
	]);
	await page.goto(path);
}

const piece = (page: Page, name: string) => page.locator(`[data-piece="${name}"]`);
async function box(page: Page, name: string) {
	const b = await piece(page, name).boundingBox();
	if (!b) throw new Error(`no se ve la pieza ${name}`);
	return b;
}

test.describe("escena de juego", () => {
	test("llena 1920×1080 sin desplazamiento y cada pieza va donde dice el diseño", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/game?token=bueno&start=284&goal=300");
		await expect(page.getByRole("progressbar")).toBeVisible();
		expect(
			await page.evaluate(() => [
				document.documentElement.scrollWidth,
				document.documentElement.scrollHeight,
			]),
		).toEqual([1920, 1080]);
		expect(await box(page, "status")).toMatchObject({ x: 48, y: 40 });
		expect(await box(page, "alerts")).toMatchObject({ x: 720, y: 40, width: 480 });
		const goal = await box(page, "goal");
		expect(goal.x + goal.width).toBe(1872);
		expect(goal.y).toBe(40);
		const chat = await box(page, "chat");
		expect([chat.x, chat.y + chat.height, chat.width, chat.height]).toEqual([48, 1032, 400, 440]);
		const cam = await box(page, "camera");
		expect([cam.x + cam.width, cam.y + cam.height, cam.width]).toEqual([1872, 1032, 384]);
		const events = await box(page, "events");
		expect([events.x + events.width, events.y + events.height]).toEqual([1872, 792]);
	});

	test("ninguna pieza fija ocupa la franja de 480 a 1440 px", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/game?token=bueno");
		await expect(page.getByRole("progressbar")).toBeVisible();
		for (const name of ["status", "goal", "chat", "events", "camera"]) {
			const b = await box(page, name);
			const overlaps = b.x < 1440 && b.x + b.width > 480;
			expect(overlaps, name).toBe(false);
		}
	});

	test("sin token se ven el chat, el estado y el marco, pero no alertas, eventos ni meta", async ({
		page,
	}) => {
		await open(page, "/overlay/jotis_1/scene/game");
		await expect(page.getByRole("log")).toBeVisible();
		await expect(piece(page, "status").getByRole("status")).toContainText("En directo");
		await expect(piece(page, "camera")).toBeVisible();
		await page.waitForTimeout(500);
		await expect(page.getByRole("progressbar")).toHaveCount(0);
		await expect(page.getByText("Berta")).toHaveCount(0);
		await expect(piece(page, "alerts").getByRole("status")).toHaveCount(0);
	});

	test("con `goal=0` no queda hueco donde iba la meta", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/game?token=bueno&goal=0");
		await expect(page.getByText("Berta")).toBeVisible();
		await expect(piece(page, "goal")).toHaveCount(0);
		await expect(page.getByRole("progressbar")).toHaveCount(0);
		// El resto, en su sitio.
		expect(await box(page, "status")).toMatchObject({ x: 48, y: 40 });
		const events = await box(page, "events");
		expect(events.x + events.width).toBe(1872);
	});

	test("`chat`, `camera` y `events` a 0 quitan su pieza", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/game?token=bueno&chat=0&camera=0&events=0");
		await expect(page.getByRole("progressbar")).toBeVisible();
		for (const name of ["chat", "camera", "events"]) await expect(piece(page, name)).toHaveCount(0);
	});
});

test.describe("escena de Just Chatting", () => {
	test("posiciones del diseño, meta y eventos debajo de la cámara a plena opacidad", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/chatting?token=bueno&start=284&goal=300");
		await expect(page.getByRole("progressbar")).toBeVisible();
		await expect(page.getByText("Berta")).toBeVisible();
		const cam = await box(page, "camera");
		expect([cam.x, cam.y, cam.width, cam.height]).toEqual([64, 112, 1216, 684]);
		const chat = await box(page, "chat");
		expect([chat.x, chat.y, chat.width, chat.height]).toEqual([1328, 280, 528, 736]);
		for (const name of ["goal", "events"]) {
			const b = await box(page, name);
			expect(b.y, name).toBeGreaterThanOrEqual(cam.y + cam.height);
			// Ni la pieza ni nada por encima rebaja la opacidad.
			const opacity = await piece(page, name).evaluate((el) => {
				let o = 1;
				for (let n: Element | null = el; n; n = n.parentElement)
					o *= Number(getComputedStyle(n).opacity);
				return o;
			});
			expect(opacity, name).toBe(1);
		}
	});

	test("la alerta entra encima del chat sin taparlo", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/chatting?token=bueno");
		const card = piece(page, "alerts").getByRole("status");
		await expect(card).toBeVisible();
		const a = await card.boundingBox();
		const chat = await box(page, "chat");
		expect((a?.y ?? 0) + (a?.height ?? 0)).toBeLessThanOrEqual(chat.y);
	});

	test("el fondo deja ver la cámara de OBS por el hueco del marco", async ({ page }) => {
		await open(page, "/overlay/jotis_1/scene/chatting");
		const mask = await piece(page, "background").evaluate((el) => getComputedStyle(el).maskImage);
		expect(mask).toContain("evenodd");
		expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
			"rgba(0, 0, 0, 0)",
		);
	});
});
