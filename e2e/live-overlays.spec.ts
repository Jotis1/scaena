import { expect, test } from "@playwright/test";
import { alert, fakeEvents, settings } from "./sse";

// specs/twitch-events y specs/obs-overlays: alertas, eventos y meta contra un flujo SSE falso.

test.describe("alertas", () => {
	test("la alerta sale con la frase de su tipo y la cifra en formato español", async ({ page }) => {
		const raid = alert({ type: "raid", user: "Otro_Canal", amount: 1284 });
		await fakeEvents(page, () => [settings(), raid]);
		await page.goto("/overlay/jotis_1/alerts?token=bueno");
		const card = page.getByRole("status");
		await expect(card).toContainText("Otro_Canal");
		await expect(card).toContainText("Llega con 1.284 personas. Bienvenidas.");
	});

	test("al cambiar una frase, la siguiente alerta ya la usa sin recargar", async ({ page }) => {
		const first = alert({ type: "raid", user: "Primero", amount: 10 });
		const second = alert({ type: "raid", user: "Segundo", amount: 20 });
		await fakeEvents(page, (r) =>
			r.n === 1 ? [settings(), first] : [settings({ raid: "Entran {espectadores} de golpe." }), second],
		);
		await page.goto("/overlay/jotis_1/alerts?token=bueno&duration=3");
		await expect(page.getByRole("status")).toContainText("Llega con 10 personas. Bienvenidas.");
		await expect(page.getByRole("status")).toContainText("Segundo", { timeout: 6000 });
		await expect(page.getByRole("status")).toContainText("Entran 20 de golpe.");
	});

	test("`message=0` no enseña el mensaje del espectador", async ({ page }) => {
		const resub = alert({ type: "resub", user: "Ana", months: 14, message: "Aquí sigo." });
		await fakeEvents(page, () => [settings(), resub]);
		await page.goto("/overlay/jotis_1/alerts?token=bueno&message=0");
		await expect(page.getByRole("status")).toContainText("14 meses ya. Gracias por seguir aquí.");
		await expect(page.getByText("Aquí sigo.")).toHaveCount(0);
	});

	test("el mensaje se pinta como texto, sin interpretar HTML", async ({ page }) => {
		const bits = alert({ type: "bits", amount: 500, message: "<img src=x onerror=alert(1)>" });
		await fakeEvents(page, () => [settings(), bits]);
		await page.goto("/overlay/jotis_1/alerts?token=bueno");
		await expect(page.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
		expect(await page.locator("img").count()).toBe(0);
	});

	test("con un token que no vale queda transparente y no reintenta", async ({ page }) => {
		const requests = await fakeEvents(page, () => ({ status: 401 }));
		await page.goto("/overlay/jotis_1/alerts?token=malo");
		await page.waitForTimeout(2000);
		// La conexión y la comprobación del motivo; ninguna más.
		expect(requests.length).toBeLessThanOrEqual(2);
		await expect(page.getByRole("status")).toHaveCount(0);
		expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
			"rgba(0, 0, 0, 0)",
		);
	});

	test("sin token no se conecta", async ({ page }) => {
		const requests = await fakeEvents(page, () => [settings()]);
		await page.goto("/overlay/jotis_1/alerts");
		await page.waitForTimeout(800);
		expect(requests).toHaveLength(0);
	});

	test("con menos movimiento, la alerta entra y sale solo con fundido", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await fakeEvents(page, () => [settings(), alert({ type: "follow", user: "Ana" })]);
		await page.goto("/overlay/jotis_1/alerts?token=bueno&duration=3");
		const card = page.getByRole("status");
		await expect(card).toBeVisible();
		const enter = await card.evaluate((el) => {
			const s = getComputedStyle(el);
			return { property: s.transitionProperty, translate: s.translate };
		});
		expect(enter.property).toBe("opacity");
		// Al salir, sigue sin moverse.
		await page.waitForTimeout(3050);
		const exit = await card.evaluate((el) => {
			const s = getComputedStyle(el);
			return { property: s.transitionProperty, translate: s.translate };
		});
		expect(exit).toEqual({ property: "opacity", translate: "0px" });
	});
});

test.describe("eventos recientes", () => {
	test("del más reciente al más antiguo, con `rows` filas", async ({ page }) => {
		const t = Date.now();
		const list = ["Ana", "Berta", "Carla", "Dani"].map((user, i) =>
			alert({ type: "follow", user, ts: t + i }),
		);
		await fakeEvents(page, () => [settings(), ...list]);
		await page.goto("/overlay/jotis_1/events?token=bueno&rows=3");
		await expect(page.getByText("Dani")).toBeVisible();
		const text = (await page.locator("body").textContent()) ?? "";
		expect(text.indexOf("Dani")).toBeLessThan(text.indexOf("Carla"));
		expect(text.indexOf("Carla")).toBeLessThan(text.indexOf("Berta"));
		await expect(page.getByText("Ana")).toHaveCount(0);
	});

	test("al reconectar no se duplica nada", async ({ page }) => {
		const follow = alert({ type: "follow", user: "Única" });
		const requests = await fakeEvents(page, () => [settings(), follow]);
		await page.goto("/overlay/jotis_1/events?token=bueno");
		await expect.poll(() => requests.length, { timeout: 5000 }).toBeGreaterThanOrEqual(3);
		await expect(page.getByText("Única")).toHaveCount(1);
		// Chromium pone Last-Event-ID por debajo de la intercepción de Playwright, así que aquí no se ve: la
		// reanudación por ese id la prueba lib/events/handler.test.ts contra el servidor.
	});
});

test.describe("meta", () => {
	test("284 + un regalo de 5 muestra 289, y al recargar se mantiene", async ({ page }) => {
		const since = Date.now() - 60_000;
		const gift = alert({ type: "gift", user: "Ana", amount: 5 });
		const requests = await fakeEvents(page, (r) =>
			// El servidor reproduce desde `since`: lo simula este flujo.
			Number(r.url.searchParams.get("since")) === since ? [settings(), gift] : [settings()],
		);
		const url = `/overlay/jotis_1/goal?token=bueno&type=subs&label=Subs%20del%20mes&start=284&goal=300&since=${since}`;
		await page.goto(url);
		await expect(page.getByText("Subs del mes")).toBeVisible();
		await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "289");
		await page.reload();
		await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "289");
		expect(requests.every((r) => r.url.searchParams.get("since") === String(since))).toBe(true);
	});
});
